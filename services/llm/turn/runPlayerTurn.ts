'use server';

import { DiceKind } from '@/domain/shared';
import { getDiceRoll } from '@/services/dice/crud/getDiceRoll';
import type { ICheckOutcome } from '@/services/llm/check/formatCheckOutcome';
import type { IRequestedCheck } from '@/services/llm/check/parseRequestedCheck';
import { adjudicatePlayerAction } from '@/services/llm/master/adjudicatePlayerAction';
import { chatWithNpc } from '@/services/llm/npc/chatWithNpc';
import type { IPlanStep } from '@/services/llm/plan/parsePlanReply';
import { planPlayerInput } from '@/services/llm/plan/planPlayerInput';
import { getNpc } from '@/services/npc/crud/getNpc';
import { movePlayer } from '@/services/player/location/movePlayer';
import { tryFireDueMeeting } from '@/services/world-event/tryFireDueMeeting';
import { resolveRequestedCheck } from './resolveRequestedCheck';
import type { IChatMessage, IRunPlayerTurnParams, ITurnReply, ITurnResult, ITurnResume, IPostPurchase } from './types';
import { ensureShopStock } from '@/services/shop/ensureShopStock';
import { chatWithNpcPostPurchase } from '@/services/llm/npc/chatWithNpcPostPurchase';
import { adjudicatePostPurchase } from '@/services/llm/master/adjudicatePostPurchase';

const lastUserMessage = (messages: IChatMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  throw new Error('Нужна хотя бы одна реплика игрока.');
};

const parseMessages = (messages: unknown, allowEmpty = false): IChatMessage[] => {
  if (!Array.isArray(messages)) throw new Error('messages должен быть массивом.');
  if (!allowEmpty && messages.length === 0) throw new Error('messages не должен быть пустым.');

  return messages.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`messages[${index}] некорректен.`);
    const raw = item as Record<string, unknown>;
    if (raw.role !== 'user' && raw.role !== 'assistant')
      throw new Error(`messages[${index}].role должен быть user или assistant.`);
    if (typeof raw.content !== 'string' || !raw.content.trim())
      throw new Error(`messages[${index}].content обязателен.`);
    return { role: raw.role, content: raw.content.trim() };
  });
};

const toResume = (step: IPlanStep, remainingSteps: IPlanStep[]): ITurnResume => {
  if (step.agent === 'npc') return { agent: 'npc', npcId: step.npcId, remainingSteps };
  if (step.agent === 'master') return { agent: 'master', remainingSteps };
  throw new Error('Проверку может запросить только npc или master.');
};

const pushReply = (replies: ITurnReply[], ran: { reply: ITurnReply; requested: IRequestedCheck | null }) => {
  if (ran.requested && ran.reply.agent === 'npc') return;
  replies.push(ran.reply);
};

const runStep = async (
  campaignId: string,
  playerId: string,
  messages: IChatMessage[],
  step: IPlanStep,
  checkOutcome?: ICheckOutcome,
  arrivalTitle?: string
): Promise<{ reply: ITurnReply; requested: IRequestedCheck | null }> => {
  if (step.agent === 'npc') {
    const result = await chatWithNpc({
      campaignId,
      playerId,
      npcId: step.npcId,
      messages,
      checkOutcome,
      arrivalTitle,
    });

    let finalOpenShop = result.openShop;

    if (finalOpenShop) {
      const npc = await getNpc(step.npcId);
      if (!npc.shopSpecialtyKey) {
        finalOpenShop = undefined;
      } else if (finalOpenShop.specialtyKey !== npc.shopSpecialtyKey) {
        finalOpenShop = { specialtyKey: npc.shopSpecialtyKey };
      }
      if (finalOpenShop) await ensureShopStock(step.npcId);
    }

    return {
      requested: result.check,
      reply: {
        agent: 'npc',
        npcId: step.npcId,
        npcName: step.npcName,
        say: result.say,
        do: result.do,
        openShop: finalOpenShop,
      },
    };
  }

  const result = await adjudicatePlayerAction({ campaignId, playerId, messages, checkOutcome });
  return {
    requested: result.check,
    reply: { agent: 'master', verdict: result.verdict, say: result.say, toolCalls: result.toolCalls },
  };
};

const loadOutcome = async (
  campaignId: string,
  playerId: string,
  rollId: string,
  check: IRunPlayerTurnParams['check'],
  resume: ITurnResume
): Promise<ICheckOutcome> => {
  if (!check) throw new Error('check обязателен для продолжения.');
  if (!rollId.trim()) throw new Error('rollId обязателен.');

  const roll = await getDiceRoll(rollId.trim());
  if (roll.campaignId !== campaignId) throw new Error('Бросок не принадлежит этой кампании.');
  if (roll.playerId !== playerId) throw new Error('Бросок не принадлежит этому игроку.');
  if (roll.die !== DiceKind.d20) throw new Error('Для проверки навыка нужен d20.');

  const resolved = await resolveRequestedCheck({
    campaignId,
    playerId,
    skill: check.skill,
    dc: check.dc,
    knowledgeId: check.knowledgeId ?? null,
    npcId: resume.agent === 'npc' ? resume.npcId : undefined,
  });

  const total = roll.value + resolved.bonus;
  return {
    skill: resolved.skill,
    dc: resolved.dc,
    d20: roll.value,
    bonus: resolved.bonus,
    total,
    passed: total >= resolved.dc,
    knowledgeId: resolved.knowledgeId,
  };
};

const resumeStep = async (campaignId: string, resume: ITurnResume): Promise<IPlanStep> => {
  if (resume.agent === 'master') return { agent: 'master' };
  const npc = await getNpc(resume.npcId);
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');
  return { agent: 'npc', npcId: npc.id, npcName: npc.name };
};

const aggregateUi = (
  replies: ITurnReply[]
): { openShop?: { npcId: string; npcName: string; specialtyKey: string } } | undefined => {
  for (const reply of replies) {
    if (reply.agent === 'npc' && reply.openShop) {
      return {
        openShop: {
          npcId: reply.npcId,
          npcName: reply.npcName,
          specialtyKey: reply.openShop.specialtyKey,
        },
      };
    }
  }
  return undefined;
};

const runPostPurchase = async (
  campaignId: string,
  playerId: string,
  rawMessages: unknown,
  purchase: IPostPurchase
): Promise<ITurnResult> => {
  const messages = parseMessages(rawMessages, true);
  const npc = await getNpc(purchase.npcId);
  if (npc.campaignId !== campaignId) throw new Error('NPC не принадлежит этой кампании.');

  const npcResult = await chatWithNpcPostPurchase({
    campaignId,
    playerId,
    npcId: purchase.npcId,
    messages,
    purchase,
  });

  const replies: ITurnReply[] = [
    {
      agent: 'npc',
      npcId: purchase.npcId,
      npcName: npc.name,
      say: npcResult.say,
      do: npcResult.do,
    },
  ];

  const masterResult = await adjudicatePostPurchase({
    campaignId,
    playerId,
    messages,
    purchase,
  });

  if (masterResult.say.trim()) {
    replies.push({
      agent: 'master',
      verdict: masterResult.verdict,
      say: masterResult.say,
      toolCalls: masterResult.toolCalls,
    });
  }

  return { status: 'done', replies };
};

export const runPlayerTurn = async (input: IRunPlayerTurnParams): Promise<ITurnResult> => {
  const campaignId = input.campaignId.trim();
  const playerId = input.playerId.trim();
  if (!campaignId) throw new Error('campaignId обязателен.');
  if (!playerId) throw new Error('playerId обязателен.');

  if (input.postPurchase) return runPostPurchase(campaignId, playerId, input.messages, input.postPurchase);

  const messages = parseMessages(input.messages);

  if (input.resume) {
    const outcome = await loadOutcome(campaignId, playerId, input.rollId ?? '', input.check, input.resume);
    const step = await resumeStep(campaignId, input.resume);
    const { reply } = await runStep(campaignId, playerId, messages, step, outcome);
    const replies: ITurnReply[] = [reply];

    for (let i = 0; i < input.resume.remainingSteps.length; i += 1) {
      const next = input.resume.remainingSteps[i];
      const ran = await runStep(campaignId, playerId, messages, next);
      pushReply(replies, ran);
      if (!ran.requested) continue;
      const check = await resolveRequestedCheck({
        campaignId,
        playerId,
        skill: ran.requested.skill,
        dc: ran.requested.dc,
        knowledgeId: ran.requested.knowledgeId,
        npcId: next.agent === 'npc' ? next.npcId : undefined,
      });
      return {
        status: 'need_check',
        replies,
        check,
        resume: toResume(next, input.resume.remainingSteps.slice(i + 1)),
        ui: aggregateUi(replies),
      };
    }

    return { status: 'done', replies, ui: aggregateUi(replies) };
  }

  const fired = await tryFireDueMeeting({
    campaignId,
    playerId,
    message: lastUserMessage(messages),
  });

  let arrivalTitle: string | undefined;
  let steps: IPlanStep[];
  if (fired) {
    if (fired.requiresMove) {
      await movePlayer({ campaignId, playerId, locationId: fired.locationId });
    }

    arrivalTitle = fired.title;
    steps = [{ agent: 'npc', npcId: fired.npcId, npcName: fired.npcName }];
  } else {
    ({ steps } = await planPlayerInput({ campaignId, playerId, messages }));
  }

  const replies: ITurnReply[] = [];

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const ran = await runStep(campaignId, playerId, messages, step, undefined, arrivalTitle);
    pushReply(replies, ran);
    if (!ran.requested) continue;

    const check = await resolveRequestedCheck({
      campaignId,
      playerId,
      skill: ran.requested.skill,
      dc: ran.requested.dc,
      knowledgeId: ran.requested.knowledgeId,
      npcId: step.agent === 'npc' ? step.npcId : undefined,
    });

    return {
      status: 'need_check',
      replies,
      check,
      resume: toResume(step, steps.slice(i + 1)),
      ui: aggregateUi(replies),
    };
  }

  return { status: 'done', replies, ui: aggregateUi(replies) };
};
