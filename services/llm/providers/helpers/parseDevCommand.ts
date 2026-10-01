export type DevCommand = 'check' | null;

const COMMAND_RE = /(?:^|\n)\s*\/check\b/i;

export const parseDevCommand = (raw: string): DevCommand => (COMMAND_RE.test(raw) ? 'check' : null);

export const lastUserContent = (messages: Array<{ role: string; content?: string | null }>) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim()) return msg.content.trim();
  }
  return '';
};
