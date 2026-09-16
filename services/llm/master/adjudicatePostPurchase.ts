'use server';

import type { IPostPurchase } from '@/services/llm/turn/types';
import { loadMasterContext } from './loadMasterContext';
import { buildMasterPrompt } from './buildMasterPrompt';
import { runMasterToolLoop, type IToolCallLog } from './runMasterToolLoop';
import type { MasterVerdict } from './parseMasterReply';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IAdjudicatePostPurchaseParams {
  campaignId: string;
  playerId: string;
  messages: IChatMessage[];
  purchase: IPostPurchase;
}

export interface IAdjudicatePostPurchaseResult {
  verdict: MasterVerdict;
  say: string;
  toolCalls: IToolCallLog[];
}

const parseMessages = (messages: unknown): IChatMessage[] => {
  if (!Array.isArray(messages)) throw new Error('messages должен быть массивом.');
  if (messages.length === 0) throw new Error('messages не должен быть пустым.');

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

export const adjudicatePostPurchase = async (
  input: IAdjudicatePostPurchaseParams
): Promise<IAdjudicatePostPurchaseResult> => {
  const campaignId = input.campaignId.trim();
  const playerId = input.playerId.trim();
  if (!campaignId) throw new Error('campaignId обязателен.');
  if (!playerId) throw new Error('playerId обязателен.');

  const messages = parseMessages(input.messages);
  const ctx = await loadMasterContext({ campaignId, playerId });

  const coinStr = formatCoins(input.purchase.totalPriceCp);
  const qtyStr = input.purchase.quantity === 1 ? '' : ` (${input.purchase.quantity} шт.)`;

  const system = `${buildMasterPrompt(ctx)}

## Контекст покупки (уже завершена)
Игрок ТОЛЬКО ЧТО купил: ${input.purchase.itemName}${qtyStr} за ${coinStr}.
Монеты и предмет уже переданы. Сделка завершена механически.

**ВАЖНО:** Торговец уже отреагировал. Твоя роль — опционально описать процесс или ощущения от покупки, если это уместно.
- Не вызывай grant_catalog_item, transfer_coins, get_coins — сделка уже прошла, предмет уже в инвентаре.
- Если покупка значимая (оружие, доспехи, магическая вещь) — можешь описать, как игрок примеряет доспех, взвешивает оружие, ощущает магию. 1–2 коротких предложения.
- Если покупка обычная (верёвка, факел, провизия) — можно промолчать (say пустая строка) или одно предложение.
- verdict всегда allowed.
- Не создавай новую сцену, не перемещай игрока, не описывай реакцию торговца (это уже сделал NPC).`;

  const reply = await runMasterToolLoop({
    system,
    messages,
    ctx: {
      campaignId,
      playerId,
    },
    forbiddenTools: ['grant_catalog_item', 'transfer_coins', 'get_coins'],
  });

  return {
    verdict: reply.verdict === 'allowed' ? 'allowed' : 'allowed',
    say: reply.say,
    toolCalls: reply.toolCalls,
  };
};
