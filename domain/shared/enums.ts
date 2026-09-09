export const LocationKind = {
  region: 'region',
  settlement: 'settlement',
  district: 'district',
  building: 'building',
  room: 'room',
  dungeon: 'dungeon',
  wilderness: 'wilderness',
  other: 'other',
} as const;

export type LocationKind = (typeof LocationKind)[keyof typeof LocationKind];

export const KnowledgeReveal = {
  open: 'open',
  check: 'check',
  hidden: 'hidden',
} as const;

export type KnowledgeReveal = (typeof KnowledgeReveal)[keyof typeof KnowledgeReveal];

export const MemoryKind = {
  episode: 'episode',
  fact: 'fact',
  favor: 'favor',
  grievance: 'grievance',
  promise: 'promise',
} as const;

export type MemoryKind = (typeof MemoryKind)[keyof typeof MemoryKind];

export const ItemKind = {
  weapon: 'weapon',
  armor: 'armor',
  shield: 'shield',
  tool: 'tool',
  gear: 'gear',
  consumable: 'consumable',
  treasure: 'treasure',
  key: 'key',
  junk: 'junk',
  other: 'other',
} as const;

export type ItemKind = (typeof ItemKind)[keyof typeof ItemKind];

export const EquipSlot = {
  armor: 'armor',
  mainHand: 'mainHand',
  offHand: 'offHand',
} as const;

export type EquipSlot = (typeof EquipSlot)[keyof typeof EquipSlot];

export const ItemRarity = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  veryRare: 'veryRare',
  legendary: 'legendary',
  artifact: 'artifact',
} as const;

export type ItemRarity = (typeof ItemRarity)[keyof typeof ItemRarity];

export const QuestStatus = {
  available: 'available',
  active: 'active',
  done: 'done',
  failed: 'failed',
} as const;

export type QuestStatus = (typeof QuestStatus)[keyof typeof QuestStatus];

export const QuestNpcRole = {
  giver: 'giver',
  participant: 'participant',
  target: 'target',
  witness: 'witness',
} as const;

export type QuestNpcRole = (typeof QuestNpcRole)[keyof typeof QuestNpcRole];

export const DiceKind = {
  d4: 'd4',
  d6: 'd6',
  d8: 'd8',
  d10: 'd10',
  d12: 'd12',
  d20: 'd20',
  d100: 'd100',
} as const;

export type DiceKind = (typeof DiceKind)[keyof typeof DiceKind];

export const TimeOfDay = {
  morning: 'morning',
  noon: 'noon',
  afternoon: 'afternoon',
  evening: 'evening',
  lateEvening: 'lateEvening',
  midnight: 'midnight',
  night: 'night',
} as const;

export type TimeOfDay = (typeof TimeOfDay)[keyof typeof TimeOfDay];

export const WorldEventStatus = {
  pending: 'pending',
  done: 'done',
} as const;

export type WorldEventStatus = (typeof WorldEventStatus)[keyof typeof WorldEventStatus];

export const WorldEventWhen = {
  nextSlot: 'nextSlot',
  onDay: 'onDay',
} as const;

export type WorldEventWhen = (typeof WorldEventWhen)[keyof typeof WorldEventWhen];
