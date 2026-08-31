import { getPlayerLocationTool } from '@/services/llm/tools/getPlayerLocationTool';
import { searchLocationTool } from '@/services/llm/tools/searchLocationTool';
import { searchNpcTool } from '@/services/llm/tools/searchNpcTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const planTools: ILlmTool[] = [getPlayerLocationTool, searchLocationTool, searchNpcTool];

export const planToolByName = new Map(planTools.map((tool) => [tool.name, tool]));
