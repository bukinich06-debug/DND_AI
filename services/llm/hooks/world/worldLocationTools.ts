import { createMentionedLocationTool } from '@/services/llm/tools/createMentionedLocationTool';
import { searchLocationTool } from '@/services/llm/tools/searchLocationTool';
import { updateMentionedLocationTool } from '@/services/llm/tools/updateMentionedLocationTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const worldLocationTools: ILlmTool[] = [
  searchLocationTool,
  createMentionedLocationTool,
  updateMentionedLocationTool,
];
