import { advanceTime } from '@/services/player/location/advanceTime';
import type { ILlmTool, IToolContext } from './types';

export const advanceTimeTool: ILlmTool = {
  name: 'advance_time',
  description:
    'Продвинуть время кампании на заданное число слотов суток (для ролевого отдыха, ожидания или сцен без механики). Не восстанавливает HP и не тратит кости хитов. Слоты: morning → noon → afternoon → evening → lateEvening → midnight → night → (следующий день) morning.',
  parameters: {
    type: 'object',
    properties: {
      slots: {
        type: 'integer',
        minimum: 1,
        description: 'Число слотов времени для продвижения (положительное целое число).',
      },
    },
    required: ['slots'],
  },
  execute: async (args, ctx: IToolContext) => {
    const result = await advanceTime({ campaignId: ctx.campaignId, slots: args.slots });
    return {
      campaignId: result.campaignId,
      dayIndex: result.dayIndex,
      timeOfDay: result.timeOfDay,
    };
  },
};
