import { TIME_OF_DAY_LABEL } from '@/domain/world-clock';
import { TimeOfDay, WorldEventWhen } from '@/domain/shared';
import { scheduleMeeting } from '@/services/world-event/scheduleMeeting';
import type { ILlmTool, IToolContext } from './types';

const SLOT_VALUES = Object.values(TimeOfDay);
const WHEN_VALUES = ['next', 'day'] as const;

interface IArgs {
  slot: TimeOfDay;
  when: 'next' | 'day';
  dayIndex?: number;
  locationId: string;
  title: string;
  npcId?: string;
  playerId: string;
}

const isSlot = (value: unknown): value is TimeOfDay =>
  typeof value === 'string' && SLOT_VALUES.includes(value as TimeOfDay);

const parseArgs = (args: unknown): IArgs => {
  if (!args || typeof args !== 'object') throw new Error('Аргументы встречи обязательны.');
  const raw = args as Record<string, unknown>;
  if (!isSlot(raw.slot)) throw new Error('Нужен слот суток.');
  if (raw.when !== 'next' && raw.when !== 'day') throw new Error('when: next или day.');
  if (typeof raw.locationId !== 'string' || !raw.locationId.trim()) throw new Error('locationId обязателен.');
  if (typeof raw.title !== 'string' || !raw.title.trim()) throw new Error('title обязателен.');
  if (typeof raw.playerId !== 'string' || !raw.playerId.trim()) throw new Error('playerId обязателен.');

  let npcId: string | undefined;
  if (raw.npcId !== undefined && raw.npcId !== null) {
    if (typeof raw.npcId !== 'string' || !raw.npcId.trim()) throw new Error('npcId должен быть строкой.');
    npcId = raw.npcId.trim();
  }

  let dayIndex: number | undefined;
  if (raw.when === 'day') {
    if (typeof raw.dayIndex !== 'number' || !Number.isInteger(raw.dayIndex) || raw.dayIndex < 1)
      throw new Error('Для when=day нужен dayIndex (день кампании от 1).');
    dayIndex = raw.dayIndex;
  }

  return {
    slot: raw.slot,
    when: raw.when,
    dayIndex,
    locationId: raw.locationId.trim(),
    title: raw.title.trim(),
    npcId,
    playerId: raw.playerId.trim(),
  };
};

export const scheduleMeetingTool: ILlmTool = {
  name: 'schedule_meeting',
  description:
    'Записывает договорённую встречу: слот суток и место. when=next — ближайший такой слот (утро, полдень, послеполудня, вечер, поздний вечер, полночь, ночь), без номера дня. when=day — конкретный dayIndex кампании. Вызывать, когда договорились о времени и месте, не вместо реплики.',
  parameters: {
    type: 'object',
    properties: {
      slot: { type: 'string', enum: SLOT_VALUES, description: 'Слот суток' },
      when: { type: 'string', enum: [...WHEN_VALUES], description: 'next — ближайший слот; day — день кампании' },
      dayIndex: { type: 'integer', minimum: 1, description: 'Номер дня кампании, только для when=day' },
      locationId: { type: 'string', description: 'ID места встречи' },
      title: { type: 'string', description: 'Кратко, о чём встреча' },
      npcId: { type: 'string', description: 'ID NPC (для мастера; у NPC подставится сам)' },
      playerId: { type: 'string', description: 'ID игрока' },
    },
    required: ['slot', 'when', 'locationId', 'title', 'playerId'],
    additionalProperties: false,
  },
  execute: async (args: unknown, ctx: IToolContext) => {
    const parsed = parseArgs(args);
    const npcId = ctx.npcId ?? parsed.npcId ?? null;
    const event = await scheduleMeeting({
      campaignId: ctx.campaignId,
      whenKind: parsed.when === 'next' ? WorldEventWhen.nextSlot : WorldEventWhen.onDay,
      slot: parsed.slot,
      dayIndex: parsed.when === 'day' ? parsed.dayIndex : null,
      locationId: parsed.locationId,
      playerId: parsed.playerId,
      npcId,
      title: parsed.title,
    });

    return {
      id: event.id,
      title: event.title,
      slot: event.slot,
      slotLabel: TIME_OF_DAY_LABEL[event.slot],
      whenKind: event.whenKind,
      dayIndex: event.dayIndex,
      locationId: event.locationId,
      playerId: event.playerId,
      npcId: event.npcId,
      status: event.status,
    };
  },
};
