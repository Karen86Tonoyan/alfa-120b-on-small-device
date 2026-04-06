// ============================================================
//  ALFA Guardian v2 — OpenAI-Compatible Adapter
//  Works with: OpenAI, Groq, Mistral, Anthropic (via compat), Google
// ============================================================

import type { ModelAdapter, ChatMessage, StreamOptions } from './types';

interface OpenAICompatConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  provider: string;
}

export class OpenAICompatAdapter implements ModelAdapter {
  provider: string;
  modelId: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(config: OpenAICompatConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.modelId = config.modelId;
    this.provider = config.provider;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async *streamChat(messages: ChatMessage[], options?: StreamOptions): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.modelId,
        messages,
        stream: true,
        temperature: options?.temperature ?? 0.5,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });

    if (!res.ok || !res.body) throw new Error(`${this.provider} error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.replace(/^data: /, '').trim();
        if (!trimmed || trimmed === '[DONE]') continue;
        try {
          const json = JSON.parse(trimmed);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Ignore malformed SSE frames and continue streaming.
        }
      }
    }
  }

  async chat(messages: ChatMessage[], options?: StreamOptions): Promise<string> {
    let result = '';
    for await (const chunk of this.streamChat(messages, options)) {
      result += chunk;
    }
    return result;
  }
}
