interface ILoc {
  id: string;
  name: string;
  parentId: string | null;
}

export const pathLabel = (loc: ILoc, byId: Map<string, ILoc>) => {
  const names: string[] = [];
  const seen = new Set<string>();
  let current: ILoc | undefined = loc;

  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return names.join(' / ');
};
