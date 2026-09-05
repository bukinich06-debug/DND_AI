import { addPlayerConditionTool } from '@/services/llm/tools/addPlayerConditionTool';
import { advanceTravelTool } from '@/services/llm/tools/advanceTravelTool';
import { applyPlayerHpTool } from '@/services/llm/tools/applyPlayerHpTool';
import { dropItemTool } from '@/services/llm/tools/dropItemTool';
import { equipItemTool } from '@/services/llm/tools/equipItemTool';
import { getCoinsTool } from '@/services/llm/tools/getCoinsTool';
import { getPlayerConditionsTool } from '@/services/llm/tools/getPlayerConditionsTool';
import { getPlayerLocationTool } from '@/services/llm/tools/getPlayerLocationTool';
import { getPlayerProficienciesTool } from '@/services/llm/tools/getPlayerProficienciesTool';
import { longRestTool } from '@/services/llm/tools/longRestTool';
import { removePlayerConditionTool } from '@/services/llm/tools/removePlayerConditionTool';
import { searchLocationItemsTool } from '@/services/llm/tools/searchLocationItemsTool';
import { searchPlayerItemsTool } from '@/services/llm/tools/searchPlayerItemsTool';
import { shortRestTool } from '@/services/llm/tools/shortRestTool';
import { startTravelTool } from '@/services/llm/tools/startTravelTool';
import { takeItemTool } from '@/services/llm/tools/takeItemTool';
import type { ILlmTool } from '@/services/llm/tools/types';
import { unequipItemTool } from '@/services/llm/tools/unequipItemTool';

export const masterTools: ILlmTool[] = [
  searchLocationItemsTool,
  searchPlayerItemsTool,
  takeItemTool,
  dropItemTool,
  equipItemTool,
  unequipItemTool,
  getCoinsTool,
  getPlayerProficienciesTool,
  getPlayerConditionsTool,
  addPlayerConditionTool,
  removePlayerConditionTool,
  applyPlayerHpTool,
  shortRestTool,
  longRestTool,
  getPlayerLocationTool,
  startTravelTool,
  advanceTravelTool,
];

export const masterToolByName = new Map(masterTools.map((tool) => [tool.name, tool]));
