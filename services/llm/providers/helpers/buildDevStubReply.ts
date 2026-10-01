import type { ILlmMessage } from '../types';
import type { DevCommand } from './parseDevCommand';

const PREFIX = '[dev]';

const textMessage = (content: string): ILlmMessage => ({ role: 'assistant', content });

const hasCheckOutcome = (system: string) => system.includes('Результат проверки игрока');

export const buildPlanStubContent = (_command: DevCommand): string => JSON.stringify([{ agent: 'master' }]);

export const buildAgentStubReply = (command: DevCommand, _messages: ILlmMessage[], system: string): ILlmMessage => {
  if (hasCheckOutcome(system))
    return textMessage(JSON.stringify({ verdict: 'allowed', say: `${PREFIX} проверка учтена.`, do: null }));

  if (command === 'check')
    return textMessage(
      JSON.stringify({
        verdict: 'check',
        say: `${PREFIX} нужна проверка восприятия.`,
        check: { skill: 'perception', dc: 12 },
      })
    );

  return textMessage(JSON.stringify({ verdict: 'allowed', say: `${PREFIX} LLM stub: ключ API не задан.`, do: null }));
};
