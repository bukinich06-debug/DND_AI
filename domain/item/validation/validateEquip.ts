import { EquipSlot, ItemKind } from '@/domain/shared';
import type { IItem, IItemProp } from '../types';
import { isTwoHanded } from './validateProperties';

const slots = new Set<string>(Object.values(EquipSlot));
const handKinds = new Set<string>([ItemKind.weapon, ItemKind.shield]);

export const assertEquipOnItem = (item: {
  kind: ItemKind;
  quantity: number;
  playerId: string | null;
  equipSlot: EquipSlot | null;
  properties: IItemProp[] | null;
}) => {
  const slot = item.equipSlot;
  if (slot == null) return;

  if (!slots.has(slot)) throw new Error('Неизвестный слот экипировки.');
  if (!item.playerId) throw new Error('Экипировать можно только предмет игрока.');
  if (item.quantity > 1) throw new Error('Стопку предметов нельзя экипировать.');

  if (slot === EquipSlot.armor && item.kind !== ItemKind.armor)
    throw new Error('В слот доспеха можно надеть только доспех.');
  if ((slot === EquipSlot.mainHand || slot === EquipSlot.offHand) && !handKinds.has(item.kind))
    throw new Error('В руки можно взять только оружие или щит.');

  if (isTwoHanded(item.properties) && slot !== EquipSlot.mainHand)
    throw new Error('Двуручное оружие можно держать только в основной руке.');
};

export const occupantsToUnequip = (
  item: { id?: string; equipSlot: EquipSlot | null; properties: IItemProp[] | null },
  others: IItem[]
) => {
  const slot = item.equipSlot;
  if (slot == null) return [];

  const twoHanded = isTwoHanded(item.properties);
  const occupants: IItem[] = [];

  for (const other of others) {
    if (item.id && other.id === item.id) continue;
    if (other.equipSlot == null) continue;
    if (slot === other.equipSlot) {
      occupants.push(other);
      continue;
    }

    const otherHands = other.equipSlot === EquipSlot.mainHand || other.equipSlot === EquipSlot.offHand;
    if (twoHanded && slot === EquipSlot.mainHand && otherHands) {
      occupants.push(other);
      continue;
    }

    const thisHands = slot === EquipSlot.mainHand || slot === EquipSlot.offHand;
    if (isTwoHanded(other.properties) && other.equipSlot === EquipSlot.mainHand && thisHands) occupants.push(other);
  }

  return occupants;
};

export const assertEquipConflicts = (
  item: { id?: string; equipSlot: EquipSlot | null; properties: IItemProp[] | null },
  others: IItem[]
) => {
  const slot = item.equipSlot;
  if (slot == null) return;

  const twoHanded = isTwoHanded(item.properties);

  for (const other of others) {
    if (item.id && other.id === item.id) continue;
    if (other.equipSlot == null) continue;

    if (slot === EquipSlot.armor && other.equipSlot === EquipSlot.armor)
      throw new Error('На персонаже уже надет доспех.');
    if (slot === other.equipSlot) throw new Error('Этот слот экипировки уже занят.');

    const otherHands = other.equipSlot === EquipSlot.mainHand || other.equipSlot === EquipSlot.offHand;
    if (twoHanded && slot === EquipSlot.mainHand && otherHands) throw new Error('Двуручное оружие занимает обе руки.');

    const thisHands = slot === EquipSlot.mainHand || slot === EquipSlot.offHand;
    if (isTwoHanded(other.properties) && other.equipSlot === EquipSlot.mainHand && thisHands)
      throw new Error('Двуручное оружие занимает обе руки.');
  }
};
