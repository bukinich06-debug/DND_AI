export interface IToolContext {
  campaignId: string;
}

export interface ILlmTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: unknown, ctx: IToolContext) => Promise<unknown>;
}
