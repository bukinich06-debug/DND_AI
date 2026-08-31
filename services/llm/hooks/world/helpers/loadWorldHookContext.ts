import { loadWorldContext, type IWorldContext } from '@/services/llm/world/loadWorldContext';
import type { IHookContext } from '../../types';

interface IWorldHookContext {
  currentLocationId: string;
  current: {
    id: string;
    name: string;
    kind: IWorldContext['location']['kind'];
    tags: string[];
    summary: string;
  };
  parent: IWorldContext['parent'];
  children: IWorldContext['children'];
  npcsHere: IWorldContext['npcsHere'];
}

export const loadWorldHookContext = async (ctx: IHookContext): Promise<IWorldHookContext> => {
  if (!ctx.locationId?.trim()) throw new Error('locationId обязателен.');

  const locationId = ctx.locationId.trim();
  const world = await loadWorldContext({
    campaignId: ctx.campaignId,
    playerId: ctx.playerId,
    lookLocationId: locationId,
  });
  const location = world.location;
  if (location.id !== locationId) throw new Error('Локация осмотра не совпадает со снимком.');

  return {
    currentLocationId: locationId,
    current: {
      id: location.id,
      name: location.name,
      kind: location.kind,
      tags: location.tags,
      summary: location.summary,
    },
    parent: world.parent,
    children: world.children,
    npcsHere: world.npcsHere,
  };
};
