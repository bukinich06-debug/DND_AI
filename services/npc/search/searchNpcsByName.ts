'use server';

import { npcAcquaintanceRepository, npcRepository } from '@/data/npc';
import type { INpc } from '@/domain/npc';

interface ISearchNpcsByNameInput {
  campaignId: string;
  name: string;
  speakerNpcId?: string;
}

export interface INpcSearchHit {
  npc: INpc;
  knownBySpeaker: boolean;
}

export const searchNpcsByName = async ({
  campaignId,
  name,
  speakerNpcId,
}: ISearchNpcsByNameInput): Promise<INpcSearchHit[]> => {
  if (!campaignId.trim()) throw new Error('campaignId обязателен.');
  if (!name.trim()) throw new Error('Имя для поиска обязательно.');

  const found = await npcRepository.searchByName({ campaignId, name });
  if (found.length === 0) return [];

  let knownIds = new Set<string>();
  if (speakerNpcId?.trim()) {
    const links = await npcAcquaintanceRepository.listByNpcId(speakerNpcId.trim());
    knownIds = new Set(links.map((l) => l.otherNpcId));
  }

  const hits = found
    .filter((npc) => !speakerNpcId || npc.id !== speakerNpcId)
    .map((npc) => ({
      npc,
      knownBySpeaker: knownIds.has(npc.id),
    }));

  hits.sort((a, b) => {
    if (a.knownBySpeaker !== b.knownBySpeaker) return a.knownBySpeaker ? -1 : 1;
    return a.npc.name.localeCompare(b.npc.name, 'ru');
  });

  return hits;
};
