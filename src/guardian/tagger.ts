// ============================================================
//  ALFA Guardian v2 — Studio Label Tagger
//  Analyzes raw prompts and stamps Studio Labels
// ============================================================

import { nanoid } from 'nanoid';
import type { StudioLabel, LabeledPrompt, TemporalPartition } from '@/types/studio-labels';
import { TEMPORAL_SIGNALS, INTENT_SIGNALS, DOMAIN_SIGNALS } from './labels';

/**
 * Score a prompt against a set of signal arrays.
 * Returns a map of { key -> score }.
 */
function scoreSignals<T extends string>(
  text: string,
  signalMap: Record<T, string[]>
): Record<T, number> {
  const lower = text.toLowerCase();
  const result = {} as Record<T, number>;

  for (const [key, signals] of Object.entries(signalMap) as [T, string[]][]) {
    result[key] = signals.filter(sig => lower.includes(sig)).length;
  }

  return result;
}

/**
 * Pick the key with the highest score; fall back to defaultKey if tied/zero.
 */
function pickTop<T extends string>(
  scores: Record<T, number>,
  defaultKey: T
): { winner: T; confidence: number; signals: string[] } {
  const entries = Object.entries(scores) as [T, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return { winner: defaultKey, confidence: 0.33, signals: [] };

  const [winner, topScore] = entries.sort((a, b) => b[1] - a[1])[0];
  const confidence = Math.min(topScore / total, 1);
  return { winner, confidence, signals: [] };
}

/**
 * GuardianTagger — the core intelligence of the ALFA Guardian.
 *
 * Usage:
 *   const tagger = new GuardianTagger();
 *   const labeled = tagger.label(rawPrompt, sessionId);
 *   // labeled.label.partition => 'yesterday' | 'today' | 'tomorrow'
 */
export class GuardianTagger {
  private history: LabeledPrompt[] = [];

  /**
   * Tag a raw prompt with Studio Labels.
   */
  label(raw: string, sessionId: string): LabeledPrompt {
    const temporalScores = scoreSignals<TemporalPartition>(raw, TEMPORAL_SIGNALS);
    const intentScores   = scoreSignals(raw, INTENT_SIGNALS);
    const domainScores   = scoreSignals(raw, DOMAIN_SIGNALS);

    // Determine partition with context boost:
    // If no strong signal, look at recent history to maintain temporal coherence
    let { winner: partition, confidence } = pickTop<TemporalPartition>(
      temporalScores,
      'today'
    );

    // Context coherence: if confidence is low (<0.4), inherit last partition
    if (confidence < 0.4 && this.history.length > 0) {
      const lastPartition = this.history[this.history.length - 1].label.partition;
      partition = lastPartition;
      confidence = Math.max(confidence, 0.3);
    }

    const { winner: intent } = pickTop(intentScores, 'execute');
    const { winner: domain } = pickTop(domainScores, 'unknown');

    // Collect matched signals for transparency
    const signals = [
      ...TEMPORAL_SIGNALS[partition].filter(s => raw.toLowerCase().includes(s)),
    ].slice(0, 5);

    const studioLabel: StudioLabel = {
      partition,
      intent,
      domain,
      confidence: parseFloat(confidence.toFixed(2)),
      signals,
      labeledAt: new Date().toISOString(),
    };

    const labeled: LabeledPrompt = {
      id: nanoid(),
      raw,
      label: studioLabel,
      sessionId,
    };

    this.history.push(labeled);
    if (this.history.length > 50) this.history.shift(); // rolling window

    return labeled;
  }

  /**
   * Get labeling history for this session.
   */
  getHistory(): LabeledPrompt[] {
    return [...this.history];
  }

  /**
   * Reset session history.
   */
  reset() {
    this.history = [];
  }
}

// Singleton instance
export const guardianTagger = new GuardianTagger();
