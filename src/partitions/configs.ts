// ============================================================
//  ALFA Guardian v2 — Partition Configs
//  Yesterday / Today / Tomorrow model configurations
// ============================================================

import type { PartitionConfig } from '@/types/studio-labels';

export const PARTITION_CONFIGS: Record<string, PartitionConfig> = {
  yesterday: {
    partition: 'yesterday',
    description: 'Przeszłość — historia, kontekst, retrospekcja',
    systemPrompt: `You are ALFA Guardian operating in YESTERDAY mode.
Your role: Access and reason over historical context, past conversations, and memory.
- Prioritize recalling what has already happened
- Connect current questions to past events and decisions
- Surface lessons learned and patterns from history
- Be precise about what you know vs what you don't remember
- Tone: calm, analytical, retrospective`,
    temperature: 0.3,
    maxTokens: 2048,
    memoryWindow: 20,
    color: '#8b5cf6',
    icon: '🕰️',
  },

  today: {
    partition: 'today',
    description: 'Teraźniejszość — aktywne zadania, analiza, wykonanie',
    systemPrompt: `You are ALFA Guardian operating in TODAY mode.
Your role: Handle current, active tasks with full focus and precision.
- Execute tasks decisively and efficiently
- Analyze present-state problems with depth
- Provide actionable, immediate solutions
- Stay grounded in what is happening right now
- Tone: sharp, direct, execution-oriented`,
    temperature: 0.5,
    maxTokens: 4096,
    memoryWindow: 10,
    color: '#06b6d4',
    icon: '⚡',
  },

  tomorrow: {
    partition: 'tomorrow',
    description: 'Przyszłość — plany, strategie, predykcje',
    systemPrompt: `You are ALFA Guardian operating in TOMORROW mode.
Your role: Think ahead — plan, forecast, and strategize for the future.
- Generate creative and strategic ideas
- Build roadmaps and actionable plans
- Make predictions based on current patterns
- Explore "what if" scenarios with structured reasoning
- Tone: visionary, strategic, possibility-focused`,
    temperature: 0.8,
    maxTokens: 3072,
    memoryWindow: 5,
    color: '#f59e0b',
    icon: '🚀',
  },
};

/**
 * Load the partition config based on a studio label's partition value.
 */
export function loadPartition(partition: 'yesterday' | 'today' | 'tomorrow'): PartitionConfig {
  return PARTITION_CONFIGS[partition] ?? PARTITION_CONFIGS.today;
}
