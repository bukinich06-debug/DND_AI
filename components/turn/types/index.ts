export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IOption {
  id: string;
  label: string;
}

export interface IPendingCheck {
  skill: string;
  skillLabel: string;
  dc: number;
  bonus: number;
  die: string;
  knowledgeId: string | null;
}

export type ITurnResume =
  { agent: 'npc'; npcId: string; remainingSteps: unknown[] } | { agent: 'master'; remainingSteps: unknown[] };

export type ITurnReply =
  | {
      agent: 'location';
      locationId: string;
      name: string;
      isSecret: boolean;
      description: string;
      summary: string;
      features: string;
    }
  | { agent: 'npc'; npcId: string; npcName: string; say: string; do: string | null }
  | { agent: 'master'; verdict: string; say: string; toolCalls: unknown[] };
