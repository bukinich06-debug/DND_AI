import { getSelfCombatStatsTool } from '@/services/llm/tools/getSelfCombatStatsTool';
import { listCombatTargetsTool } from '@/services/llm/tools/listCombatTargetsTool';
import { resolveMonsterAttackTool } from '@/services/llm/tools/resolveMonsterAttackTool';
import { rollDiceTool } from '@/services/llm/tools/rollDiceTool';
import type { ILlmTool } from '@/services/llm/tools/types';

export const monsterTools: ILlmTool[] = [
  listCombatTargetsTool,
  getSelfCombatStatsTool,
  rollDiceTool,
  resolveMonsterAttackTool,
];

export const monsterToolByName = new Map(monsterTools.map((tool) => [tool.name, tool]));
