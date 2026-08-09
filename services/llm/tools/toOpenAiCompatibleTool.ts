import type { ILlmTool } from './types';

export const toOpenAiCompatibleTool = (tool: ILlmTool) => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
});
