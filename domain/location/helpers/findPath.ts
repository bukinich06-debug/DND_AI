export interface IPathEdge {
  fromId: string;
  toId: string;
  days: number;
}

/** Двусторонний путь: [start, …, end] или null */
export const findPath = (fromId: string, toId: string, edges: IPathEdge[]): string[] | null => {
  if (fromId === toId) return [fromId];

  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    const a = adj.get(edge.fromId) ?? [];
    a.push(edge.toId);
    adj.set(edge.fromId, a);
    const b = adj.get(edge.toId) ?? [];
    b.push(edge.fromId);
    adj.set(edge.toId, b);
  }

  const queue = [fromId];
  const prev = new Map<string, string | null>([[fromId, null]]);

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) break;

    for (const next of adj.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      queue.push(next);
    }
  }

  if (!prev.has(toId)) return null;

  const path: string[] = [];
  let cur: string | null = toId;
  while (cur) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();
  return path;
};

/** Дни на ребре A↔B (двусторонне) */
export const getEdgeDays = (a: string, b: string, edges: IPathEdge[]): number | null => {
  for (const edge of edges) {
    if ((edge.fromId === a && edge.toId === b) || (edge.fromId === b && edge.toId === a)) return edge.days;
  }
  return null;
};
