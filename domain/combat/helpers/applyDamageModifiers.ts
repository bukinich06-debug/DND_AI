import { sameDamageType, type TDamageModifierKind } from './damageType';

export interface IApplyDamageModifiersResult {
  raw: number;
  amount: number;
  modifiers: TDamageModifierKind[];
}

interface IApplyDamageModifiersParams {
  amount: number;
  damageType?: string | null;
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
}

const hasType = (list: string[], damageType: string): boolean =>
  list.some((entry) => sameDamageType(entry, damageType));

export const applyDamageModifiers = ({
  amount,
  damageType,
  resistances,
  immunities,
  vulnerabilities,
}: IApplyDamageModifiersParams): IApplyDamageModifiersResult => {
  const raw = Math.max(0, Math.trunc(amount));
  if (!damageType?.trim()) return { raw, amount: raw, modifiers: [] };

  if (hasType(immunities, damageType)) return { raw, amount: 0, modifiers: ['immunity'] };

  const modifiers: TDamageModifierKind[] = [];
  let next = raw;
  if (hasType(resistances, damageType)) {
    next = Math.floor(next / 2);
    modifiers.push('resistance');
  }
  if (hasType(vulnerabilities, damageType)) {
    next *= 2;
    modifiers.push('vulnerability');
  }
  return { raw, amount: next, modifiers };
};
