import { createMentionedNpcTool } from '@/services/llm/tools/createMentionedNpcTool';
import { ensureNpcAcquaintanceTool } from '@/services/llm/tools/ensureNpcAcquaintanceTool';
import { searchNpcTool } from '@/services/llm/tools/searchNpcTool';
import { updateMentionedNpcTool } from '@/services/llm/tools/updateMentionedNpcTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const mentionTools: ILlmTool[] = [
  searchNpcTool,
  ensureNpcAcquaintanceTool,
  createMentionedNpcTool,
  updateMentionedNpcTool,
];

export const mentionToolByName = new Map(mentionTools.map((tool) => [tool.name, tool]));
