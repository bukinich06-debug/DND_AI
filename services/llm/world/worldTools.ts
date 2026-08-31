import { movePlayerTool } from '@/services/llm/tools/movePlayerTool';
import type { ILlmTool, IToolContext } from '@/services/llm/tools/types';

interface IWorldMoveState {
  moved: boolean;
}

const worldMovePlayerTool = (state: IWorldMoveState): ILlmTool => ({
  ...movePlayerTool,
  description:
    'Перемещает игрока ВНУТРЬ lookAt (locationId из снимка). Только если playerHere.id ≠ lookAt.id и реплика — вход/выход/персонаж оказывается внутри. Запрещено: вокруг, рядом, снаружи, окно, осмотр, подойти к. locationId строго lookAt.id. Дальние пути — start_travel, не этот tool.',
  execute: async (args: unknown, ctx: IToolContext) => {
    if (state.moved) throw new Error('Перемещение уже выполнено.');
    const lookAtId = ctx.locationId?.trim() || '';
    const playerHereId = ctx.playerHereId?.trim() || '';
    if (!lookAtId) throw new Error('lookAt не задан.');
    if (!playerHereId) throw new Error('Текущая локация игрока не задана.');
    if (playerHereId === lookAtId) throw new Error('Осмотр здесь, перемещение запрещено.');

    const raw = args && typeof args === 'object' ? (args as Record<string, unknown>) : null;
    const locationId = typeof raw?.locationId === 'string' ? raw.locationId.trim() : '';
    if (locationId !== lookAtId) throw new Error('move_player только в lookAt.id.');

    const result = await movePlayerTool.execute(args, ctx);
    state.moved = true;
    return result;
  },
});

export const createWorldTools = () => {
  const state: IWorldMoveState = { moved: false };
  const tools: ILlmTool[] = [worldMovePlayerTool(state)];
  return { tools, toolByName: new Map(tools.map((tool) => [tool.name, tool])) };
};
