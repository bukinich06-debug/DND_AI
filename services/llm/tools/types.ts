export interface IToolContext {
  campaignId: string;
  npcId?: string;
  playerId?: string;
  locationId?: string;
  playerHereId?: string;
}

export interface ILlmTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: unknown, ctx: IToolContext) => Promise<unknown>;
}
