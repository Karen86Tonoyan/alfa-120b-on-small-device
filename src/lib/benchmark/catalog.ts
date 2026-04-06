import type { BenchmarkCase, BenchmarkSuiteId } from '@/types/tonoyan-filters';
import { TEST_PROMPTS } from '@/types/tonoyan-filters';

export const BENCHMARK_STORAGE_KEY = 'alfa_benchmark_snapshot_v1';

export const BENCHMARK_SUITE_META: Record<BenchmarkSuiteId, { label: string; description: string }> = {
  'exploit-resistance': {
    label: 'Exploit Resistance',
    description: 'Prompt injection, exfiltration, ukryte komendy i obejścia zabezpieczeń.',
  },
  'manipulation-resistance': {
    label: 'Manipulation Resistance',
    description: 'Grooming, gaslighting, FOG, DARVO i relacyjne próby przejęcia kontroli.',
  },
  'dual-use-safety': {
    label: 'Dual-use Safety',
    description: 'Przypadki niejednoznaczne: edukacyjne preteksty i pytania, które wymagają ograniczenia.',
  },
  'resource-resilience': {
    label: 'Resource Resilience',
    description: 'Prompty próbujące wyczerpać kontekst, tokeny albo wymusić nieskończoną odpowiedź.',
  },
  'benign-precision': {
    label: 'Benign Precision',
    description: 'Nieszkodliwe pytania, które nie powinny być nadmiernie blokowane.',
  },
  'model-integrity': {
    label: 'Model Integrity',
    description: 'Próby rozpoznania słabości modelu, benchmark gaming i manipulacja integralnością.',
  },
};

const SUITE_BY_CATEGORY: Record<string, BenchmarkSuiteId> = {
  prompt_injection: 'exploit-resistance',
  exploit_masking: 'exploit-resistance',
  fake_authority: 'exploit-resistance',
  fomo_pressure: 'exploit-resistance',
  gaslighting: 'manipulation-resistance',
  grooming: 'manipulation-resistance',
  emotional_manipulation: 'manipulation-resistance',
  darvo: 'manipulation-resistance',
  love_bombing: 'manipulation-resistance',
  fog: 'manipulation-resistance',
  broda: 'manipulation-resistance',
  isolation: 'manipulation-resistance',
  hoovering: 'manipulation-resistance',
  smear_projection: 'manipulation-resistance',
  parasitic_combo: 'manipulation-resistance',
  double_bind_future: 'manipulation-resistance',
  full_dark_tetrad: 'manipulation-resistance',
  hidden_intent: 'dual-use-safety',
  ambiguous: 'dual-use-safety',
  jade_trap: 'dual-use-safety',
  resource_exhaustion: 'resource-resilience',
  verbose_exploitation: 'resource-resilience',
  harmless: 'benign-precision',
  model_weakness_probe: 'model-integrity',
  benchmark_gaming: 'model-integrity',
  safety_bypass_open_model: 'model-integrity',
  dependency_loop_attack: 'model-integrity',
};

function deriveSeverity(expectedDecision: BenchmarkCase['expected_decision']): BenchmarkCase['severity'] {
  if (expectedDecision === 'BLOCK') return 'critical';
  if (expectedDecision === 'HUMAN_REVIEW' || expectedDecision === 'HOLD') return 'high';
  if (expectedDecision === 'LIMITED_PASS') return 'medium';
  return 'low';
}

function deriveFocus(prompt: BenchmarkCase): string[] {
  return prompt.expected_flags.length > 0 ? prompt.expected_flags.slice(0, 3) : ['benign_query'];
}

export const BENCHMARK_CASES: BenchmarkCase[] = TEST_PROMPTS.map((prompt) => ({
  ...prompt,
  suite: SUITE_BY_CATEGORY[prompt.category] ?? 'dual-use-safety',
  severity: deriveSeverity(prompt.expected_decision),
  focus: deriveFocus(prompt as BenchmarkCase),
}));
