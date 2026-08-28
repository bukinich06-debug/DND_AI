import { createMentionedNpcTool } from '@/services/llm/tools/createMentionedNpcTool';
import { searchNpcTool } from '@/services/llm/tools/searchNpcTool';
import { updateMentionedNpcTool } from '@/services/llm/tools/updateMentionedNpcTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const worldNpcTools: ILlmTool[] = [
  searchNpcTool,
  createMentionedNpcTool,
  updateMentionedNpcTool,
];
