'use server';

import { buildMasterPrompt } from './buildMasterPrompt';
import { loadMasterContext } from './loadMasterContext';
import { runMasterToolLoop } from './runMasterToolLoop';

interface IDescribeArrivalParams {
  campaignId: string;
  playerId: string;
}

export interface IDescribeArrivalResult {
  description: string;
  locationId: string;
  locationName: string;
}

export const describeArrival = async (input: IDescribeArrivalParams): Promise<IDescribeArrivalResult> => {
  const campaignId = input.campaignId.trim();
  const playerId = input.playerId.trim();
  if (!campaignId) throw new Error('campaignId обязателен.');
  if (!playerId) throw new Error('playerId обязателен.');

  const ctx = await loadMasterContext({ campaignId, playerId });

  if (!ctx.world.location) throw new Error('У игрока нет текущей локации.');

  const system = buildMasterPrompt(ctx);
  const messages = [{ role: 'user' as const, content: 'Осматриваюсь. Где я и что вижу вокруг?' }];

  const reply = await runMasterToolLoop({
    system,
    messages,
    ctx: { campaignId, playerId },
  });

  return {
    description: reply.say,
    locationId: ctx.world.location.id,
    locationName: ctx.world.location.name,
  };
};
