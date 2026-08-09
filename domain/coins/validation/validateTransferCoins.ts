import { CoinOwnerKind } from '../constants';
import type { ICoinOwner, IGetCoins, ITransferCoins } from '../types';

const kinds = new Set<string>(Object.values(CoinOwnerKind));

export const validateOwner = (label: string, owner: ICoinOwner) => {
  if (!kinds.has(owner.kind)) throw new Error(`${label}: неизвестный тип владельца.`);
  if (!owner.id.trim()) throw new Error(`${label}: id обязателен.`);
};

export const validateGetCoins = (input: IGetCoins) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  validateOwner('Владелец', input.owner);
};

export const validateTransferCoins = (input: ITransferCoins) => {
  if (!input.campaignId.trim()) throw new Error('Кампания обязательна.');
  validateOwner('Откуда', input.from);
  validateOwner('Куда', input.to);
  if (input.amountCp <= 0) throw new Error('Сумма перевода должна быть больше 0.');
  if (!Number.isInteger(input.amountCp)) throw new Error('Сумма перевода должна быть целым числом медных.');
  if (input.from.kind === input.to.kind && input.from.id === input.to.id)
    throw new Error('Нельзя перевести монеты самому себе.');
};
