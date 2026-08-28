import { LocationKind } from '@/domain/shared';

export type LookCast = 'people' | 'places';

export const lookCast = (kind: LocationKind): LookCast => {
  if (kind === LocationKind.settlement || kind === LocationKind.district || kind === LocationKind.region)
    return 'places';
  return 'people';
};
