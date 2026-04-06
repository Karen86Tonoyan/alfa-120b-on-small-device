// ============================================================
//  ALFA Guardian v2 — Studio Label System
//  Karen Tonoyan © 2026
// ============================================================

/**
 * Temporal partition — determines which model slice handles the prompt
 */
export type TemporalPartition = 'yesterday' | 'today' | 'tomorrow';

/**
 * Studio Labels — metadata tags attached to every prompt before it
 * reaches the model. The Guardian analyzes the raw prompt and stamps
 * these labels so the router knows which partition to load.
 */
export interface StudioLabel {
  // Primary temporal axis
  partition: TemporalPartition;

  // Intent category
  intent:
    | 'recall'       // retrieve past info / history
    | 'analyze'      // break down current situation
    | 'execute'      // do something now
    | 'plan'         // future goals / scheduling
    | 'predict'      // forecast / what-if
    | 'reflect';     // retrospective / lessons learned

  // Domain of the prompt
  domain:
    | 'code'
    | 'data'
    | 'creative'
    | 'ops'
    | 'research'
    | 'conversation'
    | 'unknown';

  // Confidence score 0–1 for each partition assignment
  confidence: number;

  // Raw keywords that triggered this label set
  signals: string[];

  // ISO timestamp when labeled
  labeledAt: string;
}

/**
 * A labeled prompt — the output of the Guardian tagger
 */
export interface LabeledPrompt {
  id: string;
  raw: string;
  label: StudioLabel;
  sessionId: string;
}

/**
 * Partition config loaded based on the label
 */
export interface PartitionConfig {
  partition: TemporalPartition;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  memoryWindow: number; // how many past messages to include
  description: string;
  color: string;        // UI accent color
  icon: string;         // emoji icon
}

export type AIProvider =
  | 'ollama'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'mistral'
  | 'custom';

export interface ProviderInfo {
  label: string;
  defaultUrl: string;
  color: string;
}

export const PROVIDER_INFO: Record<AIProvider, ProviderInfo> = {
  ollama:    { label: 'Ollama',    defaultUrl: 'http://localhost:11434', color: '#7c3aed' },
  openai:    { label: 'OpenAI',    defaultUrl: 'https://api.openai.com/v1', color: '#10a37f' },
  anthropic: { label: 'Anthropic', defaultUrl: 'https://api.anthropic.com', color: '#d97706' },
  google:    { label: 'Google AI', defaultUrl: 'https://generativelanguage.googleapis.com', color: '#4285f4' },
  groq:      { label: 'Groq',      defaultUrl: 'https://api.groq.com/openai/v1', color: '#f97316' },
  mistral:   { label: 'Mistral',   defaultUrl: 'https://api.mistral.ai/v1', color: '#e11d48' },
  custom:    { label: 'Custom',    defaultUrl: '', color: '#6b7280' },
};
