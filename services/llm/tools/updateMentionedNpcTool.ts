import { MemoryKind } from '@/domain/shared';
import { ensureNpcAcquaintance } from '@/services/npc/acquaintance/ensureNpcAcquaintance';
import { getNpc } from '@/services/npc/crud/getNpc';
import { updateNpc } from '@/services/npc/crud/updateNpc';
import { createNpcMemoryForAgent } from '@/services/npc/memory/createNpcMemoryForAgent';
import type { ILlmTool, IToolContext } from './types';

interface IArgs {
  npcId: string;
  name?: string;
  title?: string | null;
  appearance?: string;
  personality?: string;
  speech?: string;
  habits?: string;
  memory?: string | null;
  note?: string | null;
}

const parseOptionalString = (raw: unknown, field: string): string | undefined => {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string' || !raw.trim()) throw new Error(`${field} должен быть непустой строкой.`);
  return raw.trim();
};

const parseOptionalNullableString = (raw: unknown, field: string): string | null | undefined => {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'string') throw new Error(`${field} должен быть строкой.`);
  return raw.trim() || null;
};

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы обновления NPC обязательны.');
  const raw = args as Record<string, unknown>;
  if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId обязателен.');

  const name = parseOptionalString(raw.name, 'name');
  const appearance = parseOptionalString(raw.appearance, 'appearance');
  const personality = parseOptionalString(raw.personality, 'personality');
  const speech = parseOptionalString(raw.speech, 'speech');
  const habits = parseOptionalString(raw.habits, 'habits');
  const title = parseOptionalNullableString(raw.title, 'title');
  const memory = parseOptionalNullableString(raw.memory, 'memory');
  const note = parseOptionalNullableString(raw.note, 'note');

  if (
    name === undefined &&
    title === undefined &&
    appearance === undefined &&
    personality === undefined &&
    speech === undefined &&
    habits === undefined &&
    memory === undefined &&
    note === undefined
  )
    throw new Error('Нужно хотя бы одно поле для обновления.');

  return {
    npcId: raw.npcId.trim(),
    name,
    title,
    appearance,
    personality,
    speech,
    habits,
    memory,
    note,
  };
};

export const updateMentionedNpcTool: ILlmTool = {
  name: 'update_mentioned_npc',
  description:
    'Обновляет уже известного speaker’у NPC (имя, роль, note и т.д.). Вызывай, когда ответ уточняет существующего знакомого (например роль «муж» → имя «Грэг»), а не создаёт нового.',
  parameters: {
    type: 'object',
    properties: {
      npcId: { type: 'string', description: 'ID знакомого NPC (из списка acquaintances)' },
      name: { type: 'string', description: 'Новое имя' },
      title: { type: 'string', description: 'Титул / роль' },
      appearance: { type: 'string', description: 'Внешность' },
      personality: { type: 'string', description: 'Характер' },
      speech: { type: 'string', description: 'Манера речи' },
      habits: { type: 'string', description: 'Привычки' },
      memory: {
        type: 'string',
        description: 'Новый факт о нём для памяти speaker: с именем/ролью в тексте',
      },
      note: { type: 'string', description: 'Как speaker его знает' },
    },
    required: ['npcId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    if (!ctx.npcId?.trim()) throw new Error('npcId спикера обязателен в контексте.');
    const parsed = parseArgs(args);
    const speakerId = ctx.npcId.trim();
    if (parsed.npcId === speakerId) throw new Error('Нельзя обновить самого speaker.');

    const target = await getNpc(parsed.npcId);
    if (target.campaignId !== ctx.campaignId) throw new Error('NPC из другой кампании.');

    const hasNpcPatch =
      parsed.name !== undefined ||
      parsed.title !== undefined ||
      parsed.appearance !== undefined ||
      parsed.personality !== undefined ||
      parsed.speech !== undefined ||
      parsed.habits !== undefined;

    const npc = hasNpcPatch
      ? await updateNpc(parsed.npcId, {
          ...(parsed.name !== undefined ? { name: parsed.name } : {}),
          ...(parsed.title !== undefined ? { title: parsed.title } : {}),
          ...(parsed.appearance !== undefined ? { appearance: parsed.appearance } : {}),
          ...(parsed.personality !== undefined ? { personality: parsed.personality } : {}),
          ...(parsed.speech !== undefined ? { speech: parsed.speech } : {}),
          ...(parsed.habits !== undefined ? { habits: parsed.habits } : {}),
        })
      : target;

    let acquaintance = null;
    if (parsed.note !== undefined) {
      acquaintance = await ensureNpcAcquaintance({
        npcId: speakerId,
        otherNpcId: parsed.npcId,
        note: parsed.note,
      });
    }

    let memory = null;
    if (parsed.memory) {
      memory = await createNpcMemoryForAgent(
        {
          npcId: speakerId,
          summary: parsed.memory,
          kind: MemoryKind.fact,
          playerId: null,
          aboutNpcId: parsed.npcId,
          importance: 2,
        },
        ctx.campaignId
      );
    }

    return { npc, acquaintance, memory };
  },
};
