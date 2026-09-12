const WAIT = ['жду', 'подожд', 'ждать', 'wait'];

export const isWaitMessage = (text: string) => {
  const lower = text.toLowerCase();
  return WAIT.some((token) => lower.includes(token));
};
