const HISTORY_LIMIT = 12;

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const buildPlanUserMessage = (messages: IChatMessage[]): string => {
  const recent = messages.slice(-HISTORY_LIMIT);
  let lastUserIndex = -1;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }
  if (lastUserIndex < 0) throw new Error('Нужна хотя бы одна реплика игрока.');

  const now = recent[lastUserIndex].content;
  const prior = recent.slice(0, lastUserIndex);

  if (prior.length === 0) return `## Сейчас\n${now}`;

  const history = prior
    .map((m) => (m.role === 'user' ? `Игрок: ${m.content}` : `Ответ: ${m.content}`))
    .join('\n');

  return `## История\n${history}\n\n## Сейчас\n${now}`;
};
