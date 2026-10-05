import type { TCombatSide } from './sides';

export const MELEE_REACH_FEET = 5;

export const isInMeleeReach = (a: number, b: number): boolean => Math.abs(a - b) <= MELEE_REACH_FEET;

export const leavesReachOnPath = (from: number, to: number, enemyPos: number): boolean => {
  if (from === to) return false;

  const step = to > from ? 1 : -1;
  let pos = from;
  while (pos !== to) {
    const next = pos + step;
    if (isInMeleeReach(pos, enemyPos) && !isInMeleeReach(next, enemyPos)) return true;
    pos = next;
  }

  return false;
};

interface IReachFighter {
  id: string;
  side: TCombatSide;
  positionFeet: number;
  capable: boolean;
}

interface IOpportunityAttackersInput {
  moverId: string;
  moverSide: TCombatSide;
  from: number;
  to: number;
  fighters: IReachFighter[];
}

export const opportunityAttackerIds = ({
  moverId,
  moverSide,
  from,
  to,
  fighters,
}: IOpportunityAttackersInput): string[] =>
  fighters
    .filter((f) => f.id !== moverId && f.side !== moverSide && f.capable && leavesReachOnPath(from, to, f.positionFeet))
    .sort((a, b) => Math.abs(a.positionFeet - from) - Math.abs(b.positionFeet - from))
    .map((f) => f.id);
