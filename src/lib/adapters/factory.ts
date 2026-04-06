// ============================================================
//  ALFA Guardian v2 — Adapter Factory
// ============================================================

import type { ModelAdapter } from './types';
import type { AIProvider } from '@/types/studio-labels';
import { OllamaAdapter } from './ollama';
import { OpenAICompatAdapter } from './openai-compat';

export interface AdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  modelId: string;
}

export function createAdapter(provider: AIProvider, config: AdapterConfig): ModelAdapter {
  switch (provider) {
    case 'ollama':
      return new OllamaAdapter({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        modelId: config.modelId,
      });
    case 'openai':
    case 'groq':
    case 'mistral':
    case 'custom':
      return new OpenAICompatAdapter({
        baseUrl: config.baseUrl || 'https://api.openai.com/v1',
        apiKey: config.apiKey || '',
        modelId: config.modelId,
        provider,
      });
    case 'anthropic':
      return new OpenAICompatAdapter({
        baseUrl: 'https://api.anthropic.com/v1',
        apiKey: config.apiKey || '',
        modelId: config.modelId,
        provider,
      });
    case 'google':
      return new OpenAICompatAdapter({
        baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: config.apiKey || '',
        modelId: config.modelId,
        provider,
      });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
