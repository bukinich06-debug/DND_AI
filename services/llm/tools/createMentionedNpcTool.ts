import { MemoryKind } from '@/domain/shared';
import { ensureNpcAcquaintance } from '@/services/npc/acquaintance/ensureNpcAcquaintance';
import { createNpc } from '@/services/npc/crud/createNpc';
import { createNpcMemoryForAgent } from '@/services/npc/memory/createNpcMemoryForAgent';
import type { ILlmTool, IToolContext } from './types';

const STUB_UNKNOWN = 'неизвестно';

interface IArgs {
  name: string;
  appearance: string;
  personality: string;
  speech: string;
  habits: string;
  title?: string | null;
  memory?: string | null;
  note?: string | null;
}

const parseStubField = (raw: unknown, field: string): string => {
  if (raw === undefined || raw === null) return STUB_UNKNOWN;
  if (typeof raw !== 'string') throw new Error(`${field} должен быть строкой.`);
  return raw.trim() || STUB_UNKNOWN;
};

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы создания NPC обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.name !== 'string' || !raw.name.trim()) throw new Error('name обязателен.');

  let title: string | null | undefined;
  if (raw.title === undefined) title = undefined;
  else if (raw.title === null) title = null;
  else if (typeof raw.title === 'string') title = raw.title.trim() || null;
  else throw new Error('title должен быть строкой.');

  let memory: string | null | undefined;
  if (raw.memory === undefined) memory = undefined;
  else if (raw.memory === null) memory = null;
  else if (typeof raw.memory === 'string') memory = raw.memory.trim() || null;
  else throw new Error('memory должен быть строкой.');

  let note: string | null | undefined;
  if (raw.note === undefined) note = undefined;
  else if (raw.note === null) note = null;
  else if (typeof raw.note === 'string') note = raw.note.trim() || null;
  else throw new Error('note должен быть строкой.');

  return {
    name: raw.name.trim(),
    appearance: parseStubField(raw.appearance, 'appearance'),
    personality: parseStubField(raw.personality, 'personality'),
    speech: parseStubField(raw.speech, 'speech'),
    habits: parseStubField(raw.habits, 'habits'),
    title,
    memory,
    note,
  };
};

export const createMentionedNpcTool: ILlmTool = {
  name: 'create_mentioned_npc',
  description:
    'Создаёт stub NPC, упомянутого в ответе, и связывает его со speaker (ctx.npcId). Только для нового человека: сначала сверь с acquaintances в контексте и search_npc; если это уточнение знакомого — update_mentioned_npc. Без личного имени: title=роль, name=«Роль Speaker» (напр. «Муж Мара»), не выдумывай first name. appearance/personality/speech/habits можно опустить — подставится «неизвестно»; не выдумывай детали. dmNotes проставляется автоматически.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Личное имя или provisional «Роль Speaker», если имени ещё нет',
      },
      appearance: { type: 'string', description: 'Внешность; если неизвестно — опусти' },
      personality: { type: 'string', description: 'Характер; если неизвестно — опусти' },
      speech: { type: 'string', description: 'Манера речи; если неизвестно — опусти' },
      habits: { type: 'string', description: 'Привычки; если неизвестно — опусти' },
      title: { type: 'string', description: 'Титул / роль (муж, сестра, хозяин…)' },
      memory: {
        type: 'string',
        description: 'Факт о нём для памяти speaker: с именем/ролью в тексте (не «он»)',
      },
      note: { type: 'string', description: 'Как speaker его знает (роль + якорь из реплики)' },
    },
    required: ['name'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    if (!ctx.npcId?.trim()) throw new Error('npcId спикера обязателен в контексте.');
    const parsed = parseArgs(args);
    const speakerId = ctx.npcId.trim();

    const created = await createNpc({
      campaignId: ctx.campaignId,
      name: parsed.name,
      title: parsed.title ?? null,
      appearance: parsed.appearance,
      personality: parsed.personality,
      speech: parsed.speech,
      habits: parsed.habits,
      attitude: null,
      dmNotes: `auto:mentioned-by:${speakerId}`,
    });

    const acquaintance = await ensureNpcAcquaintance({
      npcId: speakerId,
      otherNpcId: created.id,
      note: parsed.note ?? `Упомянут в разговоре: ${parsed.name}`,
    });

    let memory = null;
    if (parsed.memory) {
      memory = await createNpcMemoryForAgent(
        {
          npcId: speakerId,
          summary: parsed.memory,
          kind: MemoryKind.fact,
          playerId: null,
          aboutNpcId: created.id,
          importance: 2,
        },
        ctx.campaignId
      );
    }

    return { npc: created, acquaintance, memory };
  },
};
