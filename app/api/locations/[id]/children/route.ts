import { ok, toErrorResponse } from '@/app/api/_shared/respond';
import { listLocationChildren } from '@/services/location/crud/listLocationChildren';

interface IParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: Request, { params }: IParams) => {
  try {
    const { id } = await params;
    return ok(await listLocationChildren(id));
  } catch (e) {
    return toErrorResponse(e);
  }
};
