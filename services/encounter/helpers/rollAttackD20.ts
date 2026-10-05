import { DiceKind } from '@/domain/shared';
import { pickD20, type TRollMode } from '@/domain/combat';
import { rollDice } from '@/services/dice/roll/rollDice';

interface IRollAttackD20Params {
  campaignId: string;
  note: string;
  mode: TRollMode;
  playerId?: string | null;
}

export const rollAttackD20 = async ({ campaignId, note, mode, playerId }: IRollAttackD20Params) => {
  const first = await rollDice({
    campaignId,
    die: DiceKind.d20,
    note,
    npcId: null,
    playerId: playerId ?? null,
  });

  if (mode === 'normal') return { value: first.value, other: null, rolls: [first.value], mode };

  const second = await rollDice({
    campaignId,
    die: DiceKind.d20,
    note: `${note} (второй кубик)`,
    npcId: null,
    playerId: playerId ?? null,
  });

  const picked = pickD20(first.value, second.value, mode);
  return { value: picked.value, other: picked.other, rolls: [first.value, second.value], mode };
};
