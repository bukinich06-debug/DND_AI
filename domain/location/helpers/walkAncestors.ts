import type { LocationKind } from '@/domain/shared';

export const walkAncestors = <T extends { id: string; parentId: string | null }>(
  startId: string,
  byId: Map<string, T>
): T[] => {
  const chain: T[] = [];
  const seen = new Set<string>();
  let current: T | undefined = byId.get(startId);

  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    chain.push(current);
    if (!current.parentId) break;
    current = byId.get(current.parentId);
  }

  return chain;
};

export const findInChain = <T extends { kind: LocationKind }>(
  chain: T[],
  kinds: readonly LocationKind[]
): T | null => {
  const set = new Set<string>(kinds);
  for (const loc of chain) {
    if (set.has(loc.kind)) return loc;
  }
  return null;
};
