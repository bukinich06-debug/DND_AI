import { createMentionedLocationTool } from '@/services/llm/tools/createMentionedLocationTool';
import { ensureLocationLinkTool } from '@/services/llm/tools/ensureLocationLinkTool';
import { searchLocationTool } from '@/services/llm/tools/searchLocationTool';
import { updateMentionedLocationTool } from '@/services/llm/tools/updateMentionedLocationTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const mentionLocationTools: ILlmTool[] = [
  searchLocationTool,
  createMentionedLocationTool,
  updateMentionedLocationTool,
  ensureLocationLinkTool,
];

export const mentionLocationToolByName = new Map(mentionLocationTools.map((tool) => [tool.name, tool]));
