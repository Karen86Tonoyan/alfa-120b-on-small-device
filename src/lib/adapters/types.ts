// ============================================================
//  ALFA Guardian v2 — Model Adapter Interface
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ModelAdapter {
  provider: string;
  modelId: string;
  testConnection(): Promise<boolean>;
  streamChat(messages: ChatMessage[], options?: StreamOptions): AsyncGenerator<string>;
  chat(messages: ChatMessage[], options?: StreamOptions): Promise<string>;
}
