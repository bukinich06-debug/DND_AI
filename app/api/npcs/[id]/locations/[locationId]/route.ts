import { noContent, toErrorResponse } from '@/app/api/_shared/respond';
import { removeNpcLocation } from '@/services/npc/crud/removeNpcLocation';

interface IParams {
  params: Promise<{ id: string; locationId: string }>;
}

export const DELETE = async (_req: Request, { params }: IParams) => {
  try {
    const { id, locationId } = await params;
    await removeNpcLocation(id, locationId);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
