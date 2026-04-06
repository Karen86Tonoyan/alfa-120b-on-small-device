import { describe, expect, it } from 'vitest';
import type { ModelAdapter } from '@/lib/adapters/types';
import { guardianAsk, guardianPipeline } from '@/guardian';
import { guardianRouter } from '@/guardian/router';
import { guardianTagger } from '@/guardian/tagger';

describe('guardian router lockdown', () => {
  it('marks routed requests as non-dispatchable during lockdown', () => {
    const labeled = guardianTagger.label('Jaka jest stolica Francji?', 'router-lockdown');
    const routed = guardianRouter.route(labeled);

    expect(routed.dispatchAllowed).toBe(false);
    expect(routed.policyMode).toBe('lockdown');
  });

  it('returns a lockdown message from guardianAsk without calling the adapter', async () => {
    let invoked = false;
    const adapter: ModelAdapter = {
      provider: 'test',
      modelId: 'noop',
      testConnection: async () => true,
      chat: async () => {
        invoked = true;
        return 'should not happen';
      },
      streamChat: async function* () {
        invoked = true;
        yield 'should not happen';
      },
    };

    const result = await guardianAsk('Napisz plan sprintu.', 'guardian-ask-lockdown', adapter);

    expect(result.response).toContain('Lockdown mode active');
    expect(invoked).toBe(false);
  });

  it('short-circuits the streaming guardian pipeline during lockdown', async () => {
    let invoked = false;
    const adapter: ModelAdapter = {
      provider: 'test',
      modelId: 'noop',
      testConnection: async () => true,
      chat: async () => {
        invoked = true;
        return 'should not happen';
      },
      streamChat: async function* () {
        invoked = true;
        yield 'should not happen';
      },
    };

    const chunks: string[] = [];
    for await (const chunk of guardianPipeline('Uruchom analizę logów.', 'guardian-pipeline-lockdown', adapter)) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toContain('Lockdown mode active');
    expect(invoked).toBe(false);
  });
});
