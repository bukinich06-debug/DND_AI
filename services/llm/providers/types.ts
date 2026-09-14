export interface ILlmToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ILlmMessage {
  role: string;
  content?: string | null;
  tool_calls?: ILlmToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ISendChatParams {
  messages: ILlmMessage[];
  temperature: number;
  tools?: unknown[];
}
