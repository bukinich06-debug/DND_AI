export interface IHitDie {
  sides: number;
}

const HIT_DIE_RE = /^\s*(?:\d+)?d(\d+)\s*$/i;

export const parseHitDie = (hitDie: string): IHitDie => {
  const match = HIT_DIE_RE.exec(hitDie.trim());
  if (!match) throw new Error('Некорректная кость хитов.');
  const sides = Number(match[1]);
  if (!Number.isInteger(sides) || sides < 4) throw new Error('Некорректная кость хитов.');
  return { sides };
};
