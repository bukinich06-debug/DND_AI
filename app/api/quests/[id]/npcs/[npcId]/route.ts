import { noContent, toErrorResponse } from '@/app/api/_shared/respond';
import { requireQuery } from '@/app/api/_shared/requireQuery';
import { QuestNpcRole } from '@/domain/shared';
import { removeQuestNpc } from '@/services/quest/crud/removeQuestNpc';

interface IParams {
  params: Promise<{ id: string; npcId: string }>;
}

const isQuestNpcRole = (value: string): value is QuestNpcRole =>
  Object.values(QuestNpcRole).includes(value as QuestNpcRole);

export const DELETE = async (req: Request, { params }: IParams) => {
  try {
    const { id, npcId } = await params;
    const role = requireQuery(req.url, 'role');
    if (!isQuestNpcRole(role)) throw new Error('Некорректная роль NPC в квесте.');
    await removeQuestNpc(id, npcId, role);
    return noContent();
  } catch (e) {
    return toErrorResponse(e);
  }
};
