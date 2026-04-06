// ============================================================
//  ALFA Guardian v2 — Ollama Adapter
// ============================================================

import type { ModelAdapter, ChatMessage, StreamOptions } from './types';

interface OllamaConfig {
  baseUrl: string;
  modelId: string;
}

export class OllamaAdapter implements ModelAdapter {
  provider = 'ollama';
  modelId: string;
  private baseUrl: string;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.modelId = config.modelId;
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<{ id: string; label: string }[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      const data = await res.json();
      return (data.models || []).map((m: { name: string }) => ({ id: m.name, label: m.name }));
    } catch {
      return [];
    }
  }

  async *streamChat(messages: ChatMessage[], options?: StreamOptions): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelId,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.5,
          num_predict: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split('\n').filter(Boolean)) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) yield json.message.content;
        } catch {
          // Ignore malformed stream chunks and continue reading the response.
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
