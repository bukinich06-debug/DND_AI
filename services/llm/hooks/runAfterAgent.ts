import { startHooks } from './store/hookLock';
import { finishHook, setHookToolCalls } from './store/hookLogStore';
import type { IAgentHook, IHookContext } from './types';

interface IRunAfterAgentParams {
  chatKey: string;
  turnId: string;
  hooks: IAgentHook[];
  ctx: Omit<IHookContext, 'turnId'>;
}

export const runAfterAgent = ({ chatKey, turnId, hooks, ctx }: IRunAfterAgentParams) => {
  startHooks(chatKey, async () => {
    const fullCtx: IHookContext = { ...ctx, turnId };

    for (const hook of hooks) {
      try {
        const toolCalls = await hook.run(fullCtx);
        setHookToolCalls(turnId, hook.name, toolCalls);
        finishHook(turnId, hook.name, 'done');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ошибка хука.';
        console.error(`[hooks] ${hook.name} failed`, e);
        finishHook(turnId, hook.name, 'failed', message);
      }
    }
  });
};
