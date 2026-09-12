import type { Tool } from '../constants';
import { TOOL_ALIASES } from '../constants';

export const toolLabel = (tool: Tool): string => {
  const ru = TOOL_ALIASES[tool].find((alias) => /[а-яё]/i.test(alias));
  return ru || TOOL_ALIASES[tool][0] || tool;
};
