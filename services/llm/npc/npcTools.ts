import { addNpcMemoryTool } from '@/services/llm/tools/addNpcMemoryTool';
import { addPlayerConditionTool } from '@/services/llm/tools/addPlayerConditionTool';
import { advanceTravelTool } from '@/services/llm/tools/advanceTravelTool';
import { getCoinsTool } from '@/services/llm/tools/getCoinsTool';
import { getNpcKnowledgeTool } from '@/services/llm/tools/getNpcKnowledgeTool';
import { getNpcRelationTool } from '@/services/llm/tools/getNpcRelationTool';
import { getPlayerConditionsTool } from '@/services/llm/tools/getPlayerConditionsTool';
import { getPlayerLocationTool } from '@/services/llm/tools/getPlayerLocationTool';
import { getPlayerProficienciesTool } from '@/services/llm/tools/getPlayerProficienciesTool';
import { improveNpcRelationTool } from '@/services/llm/tools/improveNpcRelationTool';
import { listNpcKnowledgeTool } from '@/services/llm/tools/listNpcKnowledgeTool';
import { listNpcMemoriesTool } from '@/services/llm/tools/listNpcMemoriesTool';
import { movePlayerTool } from '@/services/llm/tools/movePlayerTool';
import { removePlayerConditionTool } from '@/services/llm/tools/removePlayerConditionTool';
import { searchPlayerItemsTool } from '@/services/llm/tools/searchPlayerItemsTool';
import { startTravelTool } from '@/services/llm/tools/startTravelTool';
import { transferCoinsTool } from '@/services/llm/tools/transferCoinsTool';
import type { ILlmTool } from '@/services/llm/tools/types';
import { worsenNpcRelationTool } from '@/services/llm/tools/worsenNpcRelationTool';

export const npcTools: ILlmTool[] = [
  getCoinsTool,
  transferCoinsTool,
  searchPlayerItemsTool,
  getPlayerProficienciesTool,
  getPlayerConditionsTool,
  addPlayerConditionTool,
  removePlayerConditionTool,
  getPlayerLocationTool,
  movePlayerTool,
  startTravelTool,
  advanceTravelTool,
  getNpcRelationTool,
  improveNpcRelationTool,
  worsenNpcRelationTool,
  listNpcMemoriesTool,
  addNpcMemoryTool,
  listNpcKnowledgeTool,
  getNpcKnowledgeTool,
];

export const npcToolByName = new Map(npcTools.map((tool) => [tool.name, tool]));
