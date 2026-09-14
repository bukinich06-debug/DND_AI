import type { LocationKind } from '@/domain/shared';

export interface IShopSpecialty {
  key: string;
  name: string;
  description: string;
  preferredLocationKinds: LocationKind[];
  catalogKeys: string[];
}
