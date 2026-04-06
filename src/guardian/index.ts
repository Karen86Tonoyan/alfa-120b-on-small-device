// ============================================================
//  ALFA Guardian v2 — Main Entry Point
//  The full pipeline: Tag → Route → Execute
// ============================================================

export { GuardianTagger, guardianTagger } from './tagger';
export { GuardianRouter, guardianRouter } from './router';
export { TEMPORAL_SIGNALS, INTENT_SIGNALS, DOMAIN_SIGNALS } from './labels';

import { guardianTagger } from './tagger';
import { guardianRouter } from './router';
import type { ModelAdapter } from '@/lib/adapters/types';
import type { RouterOptions } from './router';

/**
 * The Guardian Pipeline — full end-to-end flow.
 *
 * 1. Tagger analyzes raw prompt → stamps Studio Labels
 * 2. Router selects partition config based on labels
 * 3. Adapter executes the request with partition settings
 *
 * @yields text chunks from the model
 */
export async function* guardianPipeline(
  rawPrompt: string,
  sessionId: string,
  adapter: ModelAdapter,
  options: RouterOptions = {}
): AsyncGenerator<string> {
  // Step 1: Tag with Studio Labels
  const labeled = guardianTagger.label(rawPrompt, sessionId);

  // Step 2: Route to correct partition
  const routed = guardianRouter.route(labeled, options);

  if (!routed.dispatchAllowed) {
    yield 'Lockdown mode active: model dispatch disabled.';
    return;
  }

  // Step 3: Execute through adapter (streaming)
  yield* guardianRouter.execute(routed, adapter);
}

/**
 * Non-streaming version — returns full response string.
 */
export async function guardianAsk(
  rawPrompt: string,
  sessionId: string,
  adapter: ModelAdapter,
  options: RouterOptions = {}
): Promise<{ response: string; partition: string; confidence: number }> {
  const labeled = guardianTagger.label(rawPrompt, sessionId);
  const routed = guardianRouter.route(labeled, options);

  if (!routed.dispatchAllowed) {
    return {
      response: 'Lockdown mode active: model dispatch disabled.',
      partition: labeled.label.partition,
      confidence: labeled.label.confidence,
    };
  }

  let response = '';
  for await (const chunk of guardianRouter.execute(routed, adapter)) {
    response += chunk;
  }

  return {
    response,
    partition: labeled.label.partition,
    confidence: labeled.label.confidence,
  };
}
