// ============================================================
//  ALFA Guardian v2 — Partition Router
//  Routes labeled prompts to the correct model partition
// ============================================================

import type { LabeledPrompt, PartitionConfig } from '@/types/studio-labels';
import type { ModelAdapter } from '@/lib/adapters/types';
import { ALFA_LOCKDOWN_ENABLED, getPolicyMode } from '@/lib/pipeline/policy';
import { loadPartition } from '@/partitions/configs';

export interface RoutedRequest {
  labeled: LabeledPrompt;
  partition: PartitionConfig;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  dispatchAllowed: boolean;
  policyMode: 'adaptive' | 'lockdown';
}

export interface RouterOptions {
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * GuardianRouter — takes a labeled prompt and constructs
 * the full message array for the chosen partition.
 */
export class GuardianRouter {
  /**
   * Route a labeled prompt to the correct partition and build
   * the message payload.
   */
  route(labeled: LabeledPrompt, options: RouterOptions = {}): RoutedRequest {
    const partition = loadPartition(labeled.label.partition);
    const history = options.conversationHistory ?? [];

    // Trim history to the partition's memory window
    const trimmedHistory = history.slice(-partition.memoryWindow * 2);

    const messages: RoutedRequest['messages'] = [
      { role: 'system', content: partition.systemPrompt },
      ...trimmedHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: labeled.raw },
    ];

    return {
      labeled,
      partition,
      messages,
      dispatchAllowed: !ALFA_LOCKDOWN_ENABLED,
      policyMode: getPolicyMode(),
    };
  }

  /**
   * Execute a routed request through an adapter.
   * Returns a streaming async generator of text chunks.
   */
  async *execute(
    routed: RoutedRequest,
    adapter: ModelAdapter
  ): AsyncGenerator<string> {
    const { partition, messages } = routed;

    if (!routed.dispatchAllowed) {
      throw new Error('Lockdown mode active: model dispatch disabled.');
    }

    yield* adapter.streamChat(messages, {
      temperature: partition.temperature,
      maxTokens: partition.maxTokens,
    });
  }
}

export const guardianRouter = new GuardianRouter();
