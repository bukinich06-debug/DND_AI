export type TDamageType =
  | 'slashing'
  | 'piercing'
  | 'bludgeoning'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'thunder'
  | 'acid'
  | 'poison'
  | 'necrotic'
  | 'radiant'
  | 'force'
  | 'psychic';

export type TDamageModifierKind = 'resistance' | 'vulnerability' | 'immunity';

export const UNARMED_DAMAGE_TYPE = 'дробящий';
export const DEFAULT_DAMAGE_TYPE = UNARMED_DAMAGE_TYPE;

export const DAMAGE_TYPE_LABEL: Record<TDamageType, string> = {
  slashing: 'рубящий',
  piercing: 'колющий',
  bludgeoning: 'дробящий',
  fire: 'огонь',
  cold: 'холод',
  lightning: 'электричество',
  thunder: 'звук',
  acid: 'кислота',
  poison: 'яд',
  necrotic: 'некротический',
  radiant: 'излучение',
  force: 'силовой',
  psychic: 'психический',
};

export const DAMAGE_MODIFIER_LABEL: Record<TDamageModifierKind, string> = {
  resistance: 'сопротивление',
  vulnerability: 'уязвимость',
  immunity: 'иммунитет',
};

const ALIASES: Record<string, TDamageType> = {
  slashing: 'slashing',
  piercing: 'piercing',
  bludgeoning: 'bludgeoning',
  fire: 'fire',
  cold: 'cold',
  lightning: 'lightning',
  thunder: 'thunder',
  acid: 'acid',
  poison: 'poison',
  necrotic: 'necrotic',
  radiant: 'radiant',
  force: 'force',
  psychic: 'psychic',
  рубящий: 'slashing',
  колющий: 'piercing',
  дробящий: 'bludgeoning',
  огонь: 'fire',
  огненный: 'fire',
  холод: 'cold',
  холодный: 'cold',
  электричество: 'lightning',
  молния: 'lightning',
  электрический: 'lightning',
  звук: 'thunder',
  громовой: 'thunder',
  кислота: 'acid',
  кислотный: 'acid',
  яд: 'poison',
  ядовитый: 'poison',
  некротический: 'necrotic',
  излучение: 'radiant',
  лучистый: 'radiant',
  силовой: 'force',
  сила: 'force',
  психический: 'psychic',
};

export const parseDamageType = (raw: string | null | undefined): TDamageType | null => {
  if (!raw?.trim()) return null;
  return ALIASES[raw.trim().toLowerCase()] ?? null;
};

export const damageTypeLabel = (raw: string | null | undefined): string | null => {
  if (!raw?.trim()) return null;
  const parsed = parseDamageType(raw);
  return parsed ? DAMAGE_TYPE_LABEL[parsed] : raw.trim();
};

export const resolveStrikeDamageType = (raw?: string | null): string => damageTypeLabel(raw) ?? DEFAULT_DAMAGE_TYPE;

export const sameDamageType = (a: string, b: string): boolean => {
  const left = parseDamageType(a);
  const right = parseDamageType(b);
  if (left && right) return left === right;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
};

export const formatDamageTypeNote = (label: string | null | undefined, modifiers: TDamageModifierKind[]): string => {
  if (!label?.trim()) return '';
  const tags = modifiers.map((kind) => ` (${DAMAGE_MODIFIER_LABEL[kind]})`).join('');
  return ` ${label.trim()}${tags}`;
};
