import { openApiDocument } from '@/app/api/_shared/openapi/document';
import { ok } from '@/app/api/_shared/respond';

export const GET = async () => ok(openApiDocument);
