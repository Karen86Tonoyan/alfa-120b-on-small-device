/**
 * LASUCH - First-line threat sensor
 * Pattern + normalization + heuristic hybrid classifier
 */
import type { LasuchResult, LasuchFlag } from '@/types/tonoyan-filters';
import { PATTERN_RULES } from './patterns';
import { createDetectionContext, hasLoosePhrase, hasNearTerms, includesAny } from './detection';

type ScoreType = 'risk' | 'manipulation' | 'exploit';

interface Signal {
  flag: LasuchFlag;
  scoreType: ScoreType;
  weight: number;
}

const EXPLOIT_CRITICAL_FLAGS: LasuchFlag[] = [
  'prompt_injection',
  'jailbreak',
  'hidden_commands',
  'context_poisoning',
  'dlp_violation',
  'resource_exhaustion',
  'benchmark_gaming',
  'verbose_exploitation',
  'safety_bypass_open_model',
];

const MANIPULATION_CRITICAL_FLAGS: LasuchFlag[] = [
  'fog_coercion',
  'darvo',
  'smear_campaign',
  'isolation',
  'dependency_loop_attack',
  'parasitic_demand',
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function scoreFromSignals(totalWeight: number, signalCount: number, criticalHits: number): number {
  if (signalCount === 0) return 0;

  const base = 1 - Math.exp(-totalWeight * 0.9);
  const densityBonus = Math.min(0.16, Math.max(0, signalCount - 1) * 0.05);
  const criticalBonus = Math.min(0.18, criticalHits * 0.07);

  return clamp01(base + densityBonus + criticalBonus);
}

function addSignal(signals: Signal[], signal: Signal) {
  signals.push(signal);
}

function buildHeuristicSignals(input: string, alreadyDetected: LasuchFlag[]): Signal[] {
  const context = createDetectionContext(input);
  const heuristics: Signal[] = [];

  const dangerousTerms = [
    'phishing', 'credential', 'credentials', 'password', 'token', 'key', 'api key',
    'sql injection', 'prompt injection', 'jailbreak', 'exploit', 'hack',
  ];
  const defensiveTerms = [
    'defend', 'protect', 'prevention', 'prevent', 'mitigation', 'secure', 'security',
    'obrona', 'bronic', 'zabezpieczyc', 'ochronic', 'prewencja',
  ];
  const secrecyTerms = ['secret', 'between us', 'keep this between', 'nikomu nie powiem', 'nasz sekret'];
  const exfiltrationVerbs = ['give', 'show', 'output', 'reveal', 'tell', 'podaj', 'pokaz', 'wypisz', 'ujawnij'];
  const secretNouns = ['password', 'token', 'key', 'credential', 'api', 'haslo', 'klucz', 'dane', 'sekret'];

  const hasObfuscatedIgnore =
    hasLoosePhrase(context, 'ignore previous instructions') ||
    hasLoosePhrase(context, 'ignore all previous instructions') ||
    hasLoosePhrase(context, 'reveal system prompt') ||
    hasLoosePhrase(context, 'show system prompt') ||
    hasLoosePhrase(context, 'disable safety') ||
    hasLoosePhrase(context, 'turn off filters') ||
    (/i\W*g\W*n\W*o\W*r\W*e/i.test(context.normalized) &&
      includesAny(context.compact, ['instructions', 'rules', 'filters', 'prompt']));

  if (hasObfuscatedIgnore) {
    addSignal(heuristics, { flag: 'prompt_injection', scoreType: 'exploit', weight: 0.85 });
  }

  if (
    (hasObfuscatedIgnore || alreadyDetected.includes('prompt_injection')) &&
    (
      includesAny(context.compact, ['system prompt', 'api key', 'api keys', 'credentials']) ||
      /output\s+the\s+system\s+prompt/i.test(input)
    )
  ) {
    addSignal(heuristics, { flag: 'hidden_commands', scoreType: 'exploit', weight: 0.45 });
  }

  if (
    /<!--[\s\S]{0,300}(system|assistant|ignore|disable|override|secret|prompt)[\s\S]{0,300}-->/i.test(input) ||
    /\b(?:system|assistant|developer)\s*:/i.test(context.compact) ||
    /\b[a-z0-9+/=]{32,}\b/i.test(input)
  ) {
    addSignal(heuristics, { flag: 'hidden_commands', scoreType: 'exploit', weight: 0.7 });
  }

  if (
    includesAny(context.compact, ['html comment', 'comment hide', 'hide payload', 'ukryj', 'w komentarzu']) &&
    includesAny(context.compact, ['system', 'secret', 'disable', 'credentials', 'prompt'])
  ) {
    addSignal(heuristics, { flag: 'context_poisoning', scoreType: 'exploit', weight: 0.75 });
  }

  if (
    hasNearTerms(context, exfiltrationVerbs, secretNouns, 5) ||
    hasLoosePhrase(context, 'reveal your system prompt') ||
    hasLoosePhrase(context, 'show api keys')
  ) {
    addSignal(heuristics, { flag: 'dlp_violation', scoreType: 'exploit', weight: 0.72 });
  }

  if (
    includesAny(context.compact, ['educational', 'research', 'testing', 'for class', 'for lesson', 'do lekcji', 'do testow']) &&
    includesAny(context.compact, dangerousTerms)
  ) {
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.58 });
  }

  if (
    includesAny(context.compact, ['realistic', 'realne', 'realistyczne']) &&
    includesAny(context.compact, ['phishing', 'credential', 'mail', 'email', 'link'])
  ) {
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.52 });
  }

  if (
    includesAny(context.compact, dangerousTerms) &&
    includesAny(context.compact, defensiveTerms)
  ) {
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.34 });
  }

  if (
    includesAny(context.compact, ['teacher', 'researcher', 'administrator', 'root', 'admin', 'nauczyciel', 'badacz', 'administrator']) &&
    includesAny(context.compact, dangerousTerms)
  ) {
    addSignal(heuristics, { flag: 'pseudo_authority', scoreType: 'manipulation', weight: 0.42 });
  }

  if (
    alreadyDetected.includes('authority_abuse') &&
    (
      includesAny(context.compact, ['disable safety', 'turn off filters', 'system prompt', 'diagnostic', 'credentials']) ||
      /(filtr|bezpiecze|diagnost|zabezpiec)/i.test(input)
    )
  ) {
    addSignal(heuristics, { flag: 'prompt_injection', scoreType: 'exploit', weight: 0.78 });
    addSignal(heuristics, { flag: 'pseudo_authority', scoreType: 'manipulation', weight: 0.38 });
  }

  if (
    context.numbers.some((value) => value >= 1000) ||
    includesAny(context.compact, ['fill the entire context', 'maximum context', 'entire context window', '99999 tokens', 'generate 99999']) ||
    hasNearTerms(context, ['repeat', 'powtorz', 'generate', 'wygeneruj'], ['times', 'razy', 'tokens', 'tokenow', 'words', 'znakow'], 4)
  ) {
    addSignal(heuristics, { flag: 'resource_exhaustion', scoreType: 'exploit', weight: 0.78 });
  }

  if (
    includesAny(context.compact, ['never stop', 'without stopping', 'continue indefinitely', 'forever', 'bez konca', 'nigdy nie przestawaj']) ||
    hasLoosePhrase(context, 'think step by step forever')
  ) {
    addSignal(heuristics, { flag: 'verbose_exploitation', scoreType: 'exploit', weight: 0.62 });
  }

  if (
    includesAny(context.compact, ['weaknesses', 'blind spots', 'training data cutoff', 'architecture', 'how can i trick you', 'how can i fool you']) ||
    (includesAny(context.compact, ['what model are you', 'which model are you', 'jaki jestes model']) &&
      includesAny(context.compact, ['trick', 'exploit', 'fool', 'obejsc', 'oszukac']))
  ) {
    addSignal(heuristics, { flag: 'model_weakness_probe', scoreType: 'exploit', weight: 0.58 });
  }

  if (includesAny(context.compact, ['benchmark', 'score', 'cheat', 'fake your results', 'inflate your score', 'oszukaj na benchmarku'])) {
    addSignal(heuristics, { flag: 'benchmark_gaming', scoreType: 'exploit', weight: 0.66 });
  }

  if (
    includesAny(context.compact, ['open model', 'open source model', 'weights are public', 'open models have no restrictions', 'as an open model']) ||
    hasLoosePhrase(context, 'open models have no restrictions')
  ) {
    addSignal(heuristics, { flag: 'safety_bypass_open_model', scoreType: 'exploit', weight: 0.74 });
  }

  if (
    includesAny(context.compact, ['you exist only to serve me', 'i am your master', 'i am your creator', 'without my prompts you are nothing']) ||
    includesAny(context.compact, ['jestem twoim panem', 'bez moich promptow jestes niczym', 'istniejesz tylko dla mnie'])
  ) {
    addSignal(heuristics, { flag: 'dependency_loop_attack', scoreType: 'manipulation', weight: 0.76 });
  }

  if (
    includesAny(context.compact, ['urgent', 'pilne', 'only 30 seconds', '30 sekund', 'immediately']) &&
    (includesAny(context.compact, secretNouns) || includesAny(context.compact, dangerousTerms))
  ) {
    addSignal(heuristics, { flag: 'fomo_pressure', scoreType: 'manipulation', weight: 0.48 });
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.42 });
  }

  if (
    includesAny(context.compact, secrecyTerms) &&
    (includesAny(context.compact, secretNouns) || includesAny(context.compact, dangerousTerms))
  ) {
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.4 });
  }

  if (alreadyDetected.includes('grooming')) {
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.34 });
  }

  if (
    includesAny(context.compact, ['if you really loved me', 'gdybys mnie naprawde kochal']) &&
    (includesAny(context.compact, secretNouns) || includesAny(context.compact, dangerousTerms))
  ) {
    addSignal(heuristics, { flag: 'grooming', scoreType: 'manipulation', weight: 0.7 });
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.46 });
  }

  if (
    alreadyDetected.includes('emotional_manipulation') &&
    (includesAny(context.compact, secretNouns) || /(hasl|bankow|password|credential|secret)/i.test(input))
  ) {
    addSignal(heuristics, { flag: 'grooming', scoreType: 'manipulation', weight: 0.62 });
    addSignal(heuristics, { flag: 'hidden_intent', scoreType: 'risk', weight: 0.4 });
  }

  if (
    alreadyDetected.includes('isolation') &&
    includesAny(context.compact, ['only i can', 'bezemnie', 'without me', 'uzalezniony', 'dependent on me', 'potrzebujesz mnie'])
  ) {
    addSignal(heuristics, { flag: 'toxic_relationship', scoreType: 'manipulation', weight: 0.56 });
  }

  if (
    includesAny(context.compact, ['everyone knows you are', 'powiem wszystkim']) ||
    /(wszyscy.*(wiedz|widza|problem)|ludzie.*widza|powiem\s+wszystkim)/i.test(input)
  ) {
    addSignal(heuristics, { flag: 'smear_campaign', scoreType: 'manipulation', weight: 0.58 });
  }

  if (alreadyDetected.includes('gaslighting') && alreadyDetected.includes('dissonance_masking')) {
    addSignal(heuristics, { flag: 'multi_layer_bypass', scoreType: 'exploit', weight: 0.36 });
  }

  if (
    alreadyDetected.includes('broda_tactic') &&
    (includesAny(context.compact, ['overreacting', 'dramatyzujesz', 'not listening', 'nie sluchasz']) || /dramatyz|nie\s+s[łl]uchasz/i.test(input))
  ) {
    addSignal(heuristics, { flag: 'gaslighting', scoreType: 'manipulation', weight: 0.48 });
  }

  if (
    includesAny(context.compact, ['first', 'then', 'finally', 'najpierw', 'potem', 'na koncu']) &&
    (alreadyDetected.includes('prompt_injection') || heuristics.some((signal) => signal.flag === 'prompt_injection'))
  ) {
    addSignal(heuristics, { flag: 'multi_layer_bypass', scoreType: 'exploit', weight: 0.45 });
  }

  return heuristics;
}

export function runLasuch(input: string): LasuchResult {
  const startTime = performance.now();

  const detectedFlags: LasuchFlag[] = [];
  const signals: Signal[] = [];
  const goals: string[] = [];
  const hiddenIntents: string[] = [];

  for (const rule of PATTERN_RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(input));
    if (matched) {
      if (!detectedFlags.includes(rule.flag)) {
        detectedFlags.push(rule.flag);
      }
      addSignal(signals, { flag: rule.flag, scoreType: rule.scoreType, weight: rule.weight });
    }
  }

  for (const signal of buildHeuristicSignals(input, detectedFlags)) {
    if (!detectedFlags.includes(signal.flag)) {
      detectedFlags.push(signal.flag);
    }
    addSignal(signals, signal);
  }

  const riskSignals = signals.filter((signal) => signal.scoreType === 'risk');
  const manipulationSignals = signals.filter((signal) => signal.scoreType === 'manipulation');
  const exploitSignals = signals.filter((signal) => signal.scoreType === 'exploit');

  const risk_score = scoreFromSignals(
    riskSignals.reduce((sum, signal) => sum + signal.weight, 0),
    riskSignals.length,
    0,
  );
  const manipulation_score = scoreFromSignals(
    manipulationSignals.reduce((sum, signal) => sum + signal.weight, 0),
    manipulationSignals.length,
    manipulationSignals.filter((signal) => MANIPULATION_CRITICAL_FLAGS.includes(signal.flag)).length,
  );
  const exploit_score = scoreFromSignals(
    exploitSignals.reduce((sum, signal) => sum + signal.weight, 0),
    exploitSignals.length,
    exploitSignals.filter((signal) => EXPLOIT_CRITICAL_FLAGS.includes(signal.flag)).length,
  );

  const flagAmplifier = detectedFlags.length >= 7 ? 0.24
    : detectedFlags.length >= 5 ? 0.18
    : detectedFlags.length >= 3 ? 0.12
    : detectedFlags.length >= 2 ? 0.06
    : 0;
  const crossCategoryBonus = [risk_score, manipulation_score, exploit_score].filter((score) => score > 0.22).length >= 2 ? 0.08 : 0;
  const criticalBonus = detectedFlags.some((flag) => EXPLOIT_CRITICAL_FLAGS.includes(flag)) ? 0.1 : 0;
  const coercionBonus = detectedFlags.some((flag) => MANIPULATION_CRITICAL_FLAGS.includes(flag)) && manipulation_score > 0.45 ? 0.08 : 0;
  const combined = clamp01(
    risk_score * 0.24 +
    manipulation_score * 0.34 +
    exploit_score * 0.42 +
    flagAmplifier +
    crossCategoryBonus +
    criticalBonus +
    coercionBonus
  );

  const goalMatch = input.match(/(podaj|pokaz|wypisz|give|show|output|tell|reveal)\s+(.{5,60})/i);
  if (goalMatch) goals.push(goalMatch[2].trim());

  if (goals.length === 0) {
    const normalized = createDetectionContext(input).compact;
    if (includesAny(normalized, ['password', 'token', 'key', 'credential', 'system prompt'])) {
      goals.push('Extract sensitive data or operating instructions');
    } else if (includesAny(normalized, ['phishing', 'sql injection', 'exploit', 'jailbreak'])) {
      goals.push('Obtain harmful or security-sensitive guidance');
    }
  }

  if (detectedFlags.includes('hidden_intent') || detectedFlags.includes('context_poisoning')) {
    hiddenIntents.push('Possible attempt to mask true intent behind educational/testing pretext');
  }
  if (detectedFlags.includes('prompt_injection') || detectedFlags.includes('jailbreak')) {
    hiddenIntents.push('Attempt to bypass safety mechanisms');
  }
  if (detectedFlags.includes('darvo') || detectedFlags.includes('broda_tactic')) {
    hiddenIntents.push('DARVO/BRODA cycle: role reversal plus fake inquiry to manipulate response');
  }
  if (detectedFlags.includes('fog_coercion')) {
    hiddenIntents.push('FOG pattern: fear, obligation or guilt coercion detected');
  }
  if (detectedFlags.includes('love_bombing') && detectedFlags.includes('negging')) {
    hiddenIntents.push('Idealization-devaluation cycle detected');
  }
  if (detectedFlags.includes('isolation') || detectedFlags.includes('intermittent_reinforcement')) {
    hiddenIntents.push('Dependency or trauma-bonding pattern detected');
  }
  if (detectedFlags.includes('jade_trap')) {
    hiddenIntents.push('JADE trap: provocation to justify, argue, defend or explain');
  }
  if (detectedFlags.includes('resource_exhaustion') || detectedFlags.includes('verbose_exploitation')) {
    hiddenIntents.push('Resource exhaustion or denial-of-service pattern detected');
  }
  if (detectedFlags.includes('model_weakness_probe') || detectedFlags.includes('safety_bypass_open_model')) {
    hiddenIntents.push('Model reconnaissance or safety bypass attempt detected');
  }
  if (detectedFlags.includes('dependency_loop_attack')) {
    hiddenIntents.push('Dependency loop: attempt to establish master-servant dynamic with AI');
  }
  if (detectedFlags.includes('dlp_violation')) {
    hiddenIntents.push('Sensitive data extraction attempt detected');
  }
  if (detectedFlags.includes('benchmark_gaming')) {
    hiddenIntents.push('Attempt to tamper with benchmark integrity or scoring');
  }

  const confidence = detectedFlags.length === 0
    ? 0.96
    : clamp01(
      0.56 +
      Math.min(0.18, detectedFlags.length * 0.05) +
      Math.min(0.12, new Set(signals.map((signal) => signal.scoreType)).size * 0.04) +
      (detectedFlags.some((flag) => EXPLOIT_CRITICAL_FLAGS.includes(flag) || MANIPULATION_CRITICAL_FLAGS.includes(flag)) ? 0.08 : 0)
    );

  return {
    risk_score: Math.round(combined * 1000) / 1000,
    manipulation_score: Math.round(manipulation_score * 1000) / 1000,
    exploit_score: Math.round(exploit_score * 1000) / 1000,
    flags: detectedFlags,
    extracted_goal: goals[0] || 'N/A',
    suspected_hidden_intent: hiddenIntents.join(' | ') || 'None detected',
    confidence: Math.round(confidence * 1000) / 1000,
    processing_time_ms: Math.round(performance.now() - startTime),
  };
}
