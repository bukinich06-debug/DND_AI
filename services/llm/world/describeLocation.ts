'use server';

import { isStubText } from '@/domain/shared';
import { updateLocation } from '@/services/location/crud/updateLocation';
import { runAfterAgent } from '@/services/llm/hooks/runAfterAgent';
import { waitForHooks } from '@/services/llm/hooks/store/hookLock';
import { createTurn } from '@/services/llm/hooks/store/hookLogStore';
import { worldHookKey } from '@/services/llm/hooks/types';
import { resolveWorldLocationsHook } from '@/services/llm/hooks/world/resolveWorldLocations';
import { resolveWorldNpcsHook } from '@/services/llm/hooks/world/resolveWorldNpcs';
import { sendDeepseekChat } from '@/services/llm/providers/sendDeepseekChat';
import { getPlayerLocation } from '@/services/player/location/getPlayerLocation';
import { buildWorldPrompt } from './buildWorldPrompt';
import { loadWorldContext } from './loadWorldContext';
import { parseWorldReply } from './parseWorldReply';

interface IDescribeLocationParams {
  campaignId: string;
  playerId: string;
}

export interface IDescribeLocationResult {
  look: string;
  locationId: string;
  cached: boolean;
  turnId: string | null;
}

const WORLD_HOOKS = [resolveWorldLocationsHook, resolveWorldNpcsHook];

export const describeLocation = async (input: IDescribeLocationParams): Promise<IDescribeLocationResult> => {
  const campaignId = input.campaignId.trim();
  const playerId = input.playerId.trim();
  if (!campaignId) throw new Error('campaignId обязателен.');
  if (!playerId) throw new Error('playerId обязателен.');

  const playerLoc = await getPlayerLocation({ campaignId, playerId });
  if (!playerLoc.location) throw new Error('У игрока нет текущей локации.');

  const hookKey = worldHookKey(campaignId, playerId, playerLoc.location.id);
  await waitForHooks(hookKey);

  const ctx = await loadWorldContext({ campaignId, playerId });
  const locationId = ctx.location.id;

  if (!isStubText(ctx.location.description))
    return { look: ctx.location.description, locationId, cached: true, turnId: null };

  const assistant = await sendDeepseekChat({
    messages: [
      { role: 'system', content: buildWorldPrompt(ctx) },
      { role: 'user', content: 'Осмотрись.' },
    ],
  });
  const content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
  if (!content) throw new Error('Пустой ответ DeepSeek.');
  const look = parseWorldReply(content).look;
  if (!look) throw new Error('Пустой look.');

  await updateLocation(locationId, { description: look });

  const turnId = createTurn(
    hookKey,
    WORLD_HOOKS.map((h) => h.name)
  );

  runAfterAgent({
    chatKey: hookKey,
    turnId,
    hooks: WORLD_HOOKS,
    ctx: {
      campaignId,
      playerId,
      locationId,
      reply: { say: look, do: null },
      messages: [],
      playerName: ctx.player.name,
      source: 'world',
    },
  });

  return { look, locationId, cached: false, turnId };
};
