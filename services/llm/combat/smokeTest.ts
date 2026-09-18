/**
 * Smoke test для агента Комбат
 * Проверяет, что основные экспорты доступны и типы корректны
 */

import type { IRunPlayerCombatTurnResult } from './runPlayerCombatTurn';
import { runPlayerCombatTurn } from './runPlayerCombatTurn';
import { combatTools, combatToolByName } from './combatTools';

// Проверка экспортов
const _checkExports = () => {
  const _fn: typeof runPlayerCombatTurn = runPlayerCombatTurn;
  const _tools: typeof combatTools = combatTools;
  const _toolMap: typeof combatToolByName = combatToolByName;
  
  type _Result = IRunPlayerCombatTurnResult;
  
  return { _fn, _tools, _toolMap };
};

// Проверка наличия всех необходимых tools
const expectedToolNames = [
  'list_combat_targets',
  'get_player_combat_stats',
  'roll_dice',
  'move_player_in_combat',
  'resolve_player_attack',
];

const checkTools = () => {
  const missingTools = expectedToolNames.filter((name) => !combatToolByName.has(name));
  
  if (missingTools.length > 0) {
    throw new Error(`Отсутствуют tools: ${missingTools.join(', ')}`);
  }
  
  console.log('✅ Все необходимые tools присутствуют');
  console.log('Tools:', Array.from(combatToolByName.keys()).join(', '));
};

if (require.main === module) {
  checkTools();
}

export { checkTools };
