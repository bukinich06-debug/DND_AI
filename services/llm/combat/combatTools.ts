import { getPlayerCombatStatsTool } from '@/services/llm/tools/getPlayerCombatStatsTool';
import { listCombatTargetsTool } from '@/services/llm/tools/listCombatTargetsTool';
import { movePlayerInCombatTool } from '@/services/llm/tools/movePlayerInCombatTool';
import { resolvePlayerAttackTool } from '@/services/llm/tools/resolvePlayerAttackTool';
import { rollDiceTool } from '@/services/llm/tools/rollDiceTool';
import { usePlayerConsumableTool } from '@/services/llm/tools/usePlayerConsumableTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const combatTools: ILlmTool[] = [
  listCombatTargetsTool,
  getPlayerCombatStatsTool,
  rollDiceTool,
  movePlayerInCombatTool,
  resolvePlayerAttackTool,
  usePlayerConsumableTool,
];

export const combatToolByName = new Map(combatTools.map((tool) => [tool.name, tool]));
