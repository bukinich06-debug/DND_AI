'use server';

import type { IPostPurchase } from '@/services/llm/turn/types';
import { loadNpcChatContext } from './loadNpcChatContext';
import { buildNpcPrompt } from './buildNpcPrompt';
import { runNpcToolLoop } from './runNpcToolLoop';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IChatWithNpcPostPurchaseParams {
  campaignId: string;
  npcId: string;
  playerId: string;
  messages: IChatMessage[];
  purchase: IPostPurchase;
}

export interface IChatWithNpcPostPurchaseResult {
  say: string;
  do: string | null;
}

const parseMessages = (messages: unknown): IChatMessage[] => {
  if (!Array.isArray(messages)) throw new Error('messages должен быть массивом.');

  return messages.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`messages[${index}] некорректен.`);
    const raw = item as Record<string, unknown>;
    if (raw.role !== 'user' && raw.role !== 'assistant')
      throw new Error(`messages[${index}].role должен быть user или assistant.`);
    if (typeof raw.content !== 'string' || !raw.content.trim())
      throw new Error(`messages[${index}].content обязателен.`);
    return { role: raw.role, content: raw.content.trim() };
  });
};

const formatCoins = (cp: number) => {
  const gp = Math.floor(cp / 100);
  const sp = Math.floor((cp % 100) / 10);
  const remaining = cp % 10;
  const parts = [];
  if (gp > 0) parts.push(`${gp} gp`);
  if (sp > 0) parts.push(`${sp} sp`);
  if (remaining > 0) parts.push(`${remaining} cp`);
  return parts.join(', ') || '0 cp';
};

export const chatWithNpcPostPurchase = async (
  input: IChatWithNpcPostPurchaseParams
): Promise<IChatWithNpcPostPurchaseResult> => {
  const messages = parseMessages(input.messages);

  const chatCtx = await loadNpcChatContext({
    campaignId: input.campaignId,
    npcId: input.npcId,
    playerId: input.playerId,
  });

  const systemBase = buildNpcPrompt(chatCtx);
  const coinStr = formatCoins(input.purchase.totalPriceCp);
  const qtyStr = input.purchase.quantity === 1 ? '' : ` (${input.purchase.quantity} шт.)`;
  const system = `${systemBase}

## Контекст покупки (уже завершена)
Игрок ТОЛЬКО ЧТО купил: ${input.purchase.itemName}${qtyStr} за ${coinStr}.
Монеты и предмет уже переданы. Сделка завершена механически.

**ВАЖНО:** Твоя задача — отреагировать на завершённую покупку в характере.
- Не предлагай купить снова и не обсуждай цену (уже оплачено).
- Не вызывай get_coins, transfer_coins, search_player_items — сделка уже прошла.
- Реагируй как торговец: благодари, напутствуй, комментируй выбор, предлагай дополнительные товары, даёшь совет по использованию — в своём стиле.
- Если это важная покупка (оружие, доспехи, магическая вещь) — можешь коротко прокомментировать её особенности или пользу. Не читай характеристики из справочника.
- Если это обычный товар (верёвка, факел) — можно просто коротко: «Держи. Удачи.» или подобное.
- do используй, только если физически что-то делаешь (передаёшь предмет, заворачиваешь в ткань, протягиваешь).

Поле openShop не возвращай — окно магазина уже было.`;

  const reply = await runNpcToolLoop({
    system,
    messages,
    ctx: {
      campaignId: input.campaignId,
      npcId: input.npcId,
      playerId: input.playerId,
    },
    forbiddenTools: ['transfer_coins', 'get_coins'],
  });

  return { say: reply.say, do: reply.do };
};
