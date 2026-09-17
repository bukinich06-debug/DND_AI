import { addPlayerConditionTool } from '@/services/llm/tools/addPlayerConditionTool';
import { advanceTimeTool } from '@/services/llm/tools/advanceTimeTool';
import { advanceTravelTool } from '@/services/llm/tools/advanceTravelTool';
import { applyPlayerHpTool } from '@/services/llm/tools/applyPlayerHpTool';
import { dropItemTool } from '@/services/llm/tools/dropItemTool';
import { equipItemTool } from '@/services/llm/tools/equipItemTool';
import { getCoinsTool } from '@/services/llm/tools/getCoinsTool';
import { getPlayerConditionsTool } from '@/services/llm/tools/getPlayerConditionsTool';
import { getPlayerLocationTool } from '@/services/llm/tools/getPlayerLocationTool';
import { getPlayerProficienciesTool } from '@/services/llm/tools/getPlayerProficienciesTool';
import { grantCatalogItemTool } from '@/services/llm/tools/grantCatalogItemTool';
import { longRestTool } from '@/services/llm/tools/longRestTool';
import { removePlayerConditionTool } from '@/services/llm/tools/removePlayerConditionTool';
import { scheduleMeetingTool } from '@/services/llm/tools/scheduleMeetingTool';
import { searchItemCatalogTool } from '@/services/llm/tools/searchItemCatalogTool';
import { searchLocationItemsTool } from '@/services/llm/tools/searchLocationItemsTool';
import { searchPlayerItemsTool } from '@/services/llm/tools/searchPlayerItemsTool';
import { shortRestTool } from '@/services/llm/tools/shortRestTool';
import { startCombatTool } from '@/services/llm/tools/startCombatTool';
import { startTravelTool } from '@/services/llm/tools/startTravelTool';
import { takeItemTool } from '@/services/llm/tools/takeItemTool';
import type { ILlmTool } from '@/services/llm/tools/types';
import { unequipItemTool } from '@/services/llm/tools/unequipItemTool';

export const masterTools: ILlmTool[] = [
  searchLocationItemsTool,
  searchPlayerItemsTool,
  searchItemCatalogTool,
  takeItemTool,
  dropItemTool,
  grantCatalogItemTool,
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
  advanceTimeTool,
  scheduleMeetingTool,
  startCombatTool,
];

export const masterToolByName = new Map(masterTools.map((tool) => [tool.name, tool]));
