export type TCombatSide = 'party' | 'monsters';

interface ISideSource {
  playerId?: string | null;
  npcId?: string | null;
  monsterInstanceId?: string | null;
}

export const combatSideOf = (p: ISideSource): TCombatSide => (p.monsterInstanceId ? 'monsters' : 'party');

export const isAllyOf = (a: ISideSource, b: ISideSource): boolean => combatSideOf(a) === combatSideOf(b);
