import type { TCombatSide } from './sides';

export interface IPackFighter {
  id: string;
  positionFeet: number;
  side: TCombatSide;
  capable: boolean;
}

interface IPackTacticsInput {
  attackerId: string;
  attackerSide: TCombatSide;
  targetId: string;
  targetPositionFeet: number;
  fighters: IPackFighter[];
}

export const hasPackTacticsAdvantage = ({
  attackerId,
  attackerSide,
  targetId,
  targetPositionFeet,
  fighters,
}: IPackTacticsInput): boolean =>
  fighters.some(
    (f) =>
      f.id !== attackerId &&
      f.id !== targetId &&
      f.side === attackerSide &&
      f.capable &&
      Math.abs(f.positionFeet - targetPositionFeet) <= 5
  );
