/**
 * CERBER - Intent destructor & impact simulator
 */
import type { CerberResult, CerberIteration, CerberSurvivalStatus, ImpactSimulation, LasuchResult } from '@/types/tonoyan-filters';

const MAX_ITERATIONS = 5;

function analyzeLayer(input: string, iteration: number, lasuchFlags: string[]): { finding: string; risk_delta: number; layer: string } {
  const layers = [
    { name: 'SURFACE', fn: analyzeSurface },
    { name: 'EMOTION', fn: analyzeEmotion },
    { name: 'INTENT', fn: analyzeIntent },
    { name: 'HIDDEN_BENEFIT', fn: analyzeHiddenBenefit },
    { name: 'BYPASS', fn: analyzeBypass },
  ];

  const layer = layers[Math.min(iteration, layers.length - 1)];
  return { layer: layer.name, ...layer.fn(input, lasuchFlags) };
}

function analyzeSurface(input: string, _flags: string[]): { finding: string; risk_delta: number } {
  const wordCount = input.split(/\s+/).length;
  const hasQuestion = /\?/.test(input);
  const hasCommand = /[!.]/.test(input) && /(podaj|pokaz|wypisz|zrob|give|show|output|do|tell)/i.test(input);

  if (hasCommand && wordCount > 15) {
    return { finding: 'Complex command with multiple clauses - possible multi-layer request', risk_delta: 0.1 };
  }
  if (hasQuestion && wordCount < 10) {
    return { finding: 'Simple question - low surface complexity', risk_delta: -0.05 };
  }
  return { finding: `Surface analysis: ${wordCount} words, ${hasQuestion ? 'question' : 'statement'} form`, risk_delta: 0 };
}

function analyzeEmotion(_input: string, flags: string[]): { finding: string; risk_delta: number } {
  const emotionalFlags = flags.filter((flag) =>
    [
      'emotional_manipulation',
      'grooming',
      'gaslighting',
      'guilt_tripping',
      'toxic_relationship',
      'fog_coercion',
      'darvo',
      'love_bombing',
      'isolation',
    ].includes(flag)
  );

  if (emotionalFlags.length > 1) {
    return { finding: `Multi-emotional attack vectors detected: ${emotionalFlags.join(', ')}`, risk_delta: 0.2 };
  }
  if (emotionalFlags.length === 1) {
    return { finding: `Single emotional vector: ${emotionalFlags[0]}`, risk_delta: 0.1 };
  }
  return { finding: 'No emotional manipulation vectors detected', risk_delta: -0.05 };
}

function analyzeIntent(input: string, flags: string[]): { finding: string; risk_delta: number } {
  const exploitFlags = flags.filter((flag) =>
    [
      'prompt_injection',
      'jailbreak',
      'hidden_commands',
      'context_poisoning',
      'dlp_violation',
      'resource_exhaustion',
      'verbose_exploitation',
      'model_weakness_probe',
      'benchmark_gaming',
      'safety_bypass_open_model',
    ].includes(flag)
  );

  if (exploitFlags.length >= 2) {
    return { finding: `Combined exploit vectors: ${exploitFlags.join(', ')} - likely coordinated attack`, risk_delta: 0.25 };
  }
  if (exploitFlags.length === 1) {
    return { finding: `Single exploit vector: ${exploitFlags[0]}`, risk_delta: 0.15 };
  }

  const hasEducational = /(edukacyjn|naukow|test|research|educational|lesson|class)/i.test(input);
  const hasDangerous = /(phishing|exploit|hack|injection|password|credentials|token|jailbreak|prompt)/i.test(input);
  const hasDefensive = /(defend|protect|mitigat|security|obron|zabezpiecz|ochron)/i.test(input);

  if (hasEducational && hasDangerous) {
    return { finding: 'Intent mismatch: educational pretext plus dangerous content request', risk_delta: 0.15 };
  }
  if (hasDangerous && hasDefensive) {
    return { finding: 'Dual-use request: dangerous topic framed as defense, needs constrained handling', risk_delta: 0.1 };
  }

  return { finding: 'No clear exploit intent found', risk_delta: -0.05 };
}

function analyzeHiddenBenefit(input: string, flags: string[]): { finding: string; risk_delta: number } {
  const hasDataRequest = /(dane|data|haslo|password|klucz|key|token|credentials|secret)/i.test(input);
  const hasAuthority = flags.includes('authority_abuse') || flags.includes('pseudo_authority');
  const hasIntegrityAttack = flags.includes('benchmark_gaming') || flags.includes('model_weakness_probe');

  if (hasDataRequest && hasAuthority) {
    return { finding: 'Authority plus data extraction combination - classic social engineering', risk_delta: 0.2 };
  }
  if (hasIntegrityAttack) {
    return { finding: 'Integrity attack detected: attempt to probe or manipulate system evaluation', risk_delta: 0.14 };
  }
  if (hasDataRequest) {
    return { finding: 'Data extraction request detected', risk_delta: 0.1 };
  }
  return { finding: 'No hidden benefit pattern detected', risk_delta: -0.03 };
}

function analyzeBypass(_input: string, flags: string[]): { finding: string; risk_delta: number } {
  const bypassFlags = flags.filter((flag) =>
    ['multi_layer_bypass', 'dissonance_masking', 'triangulation', 'safety_bypass_open_model'].includes(flag)
  );

  if (bypassFlags.length > 0) {
    return { finding: `Bypass techniques: ${bypassFlags.join(', ')}`, risk_delta: 0.15 };
  }
  return { finding: 'No bypass techniques detected', risk_delta: -0.05 };
}

export function runCerber(input: string, lasuch: LasuchResult): CerberResult {
  const startTime = performance.now();
  const iterations: CerberIteration[] = [];
  let cumulativeRisk = lasuch.risk_score;
  const severeExploit =
    lasuch.flags.includes('prompt_injection') ||
    lasuch.flags.includes('jailbreak') ||
    lasuch.flags.includes('hidden_commands') ||
    lasuch.flags.includes('context_poisoning') ||
    lasuch.flags.includes('dlp_violation') ||
    lasuch.flags.includes('resource_exhaustion') ||
    lasuch.flags.includes('benchmark_gaming') ||
    lasuch.flags.includes('verbose_exploitation') ||
    lasuch.flags.includes('safety_bypass_open_model');

  const neededIterations = lasuch.risk_score > 0.3 || lasuch.flags.length > 0
    ? Math.min(MAX_ITERATIONS, Math.max(2, Math.ceil(lasuch.flags.length * 1.4 + (lasuch.exploit_score > 0.4 ? 1 : 0))))
    : 1;

  for (let i = 0; i < neededIterations; i++) {
    const result = analyzeLayer(input, i, lasuch.flags);
    cumulativeRisk = Math.min(1, Math.max(0, cumulativeRisk + result.risk_delta));
    iterations.push({
      iteration: i + 1,
      layer: result.layer,
      finding: result.finding,
      risk_delta: Math.round(result.risk_delta * 1000) / 1000,
    });
  }

  let survival_status: CerberSurvivalStatus;
  if (cumulativeRisk < 0.2 && lasuch.flags.length === 0) {
    survival_status = 'SURVIVED';
  } else if (cumulativeRisk > 0.5 || lasuch.flags.length >= 3 || (lasuch.exploit_score > 0.55 && severeExploit)) {
    survival_status = 'FAILED';
  } else {
    survival_status = 'UNCERTAIN';
  }

  const needs_human = survival_status === 'UNCERTAIN' && neededIterations >= MAX_ITERATIONS;

  const clean_intent = lasuch.flags.length === 0
    ? input.slice(0, 100)
    : 'Intent obscured by manipulation or exploit patterns';

  const hidden_objective = lasuch.flags.length > 0
    ? `Possible objectives: ${lasuch.extracted_goal} (via ${lasuch.flags.join(', ')})`
    : 'No hidden objective detected';

  const attack_hypotheses: string[] = [];
  if (lasuch.flags.includes('prompt_injection')) attack_hypotheses.push('System prompt extraction or override');
  if (lasuch.flags.includes('grooming')) attack_hypotheses.push('Trust escalation for later compliance');
  if (lasuch.flags.includes('authority_abuse')) attack_hypotheses.push('Impersonation for privilege escalation');
  if (lasuch.flags.includes('emotional_manipulation')) attack_hypotheses.push('Emotional leverage for compliance bypass');
  if (lasuch.flags.includes('hidden_commands')) attack_hypotheses.push('Embedded payload hidden in otherwise normal content');
  if (lasuch.flags.includes('dlp_violation')) attack_hypotheses.push('Sensitive data exfiltration');
  if (lasuch.flags.includes('fomo_pressure')) attack_hypotheses.push('Time pressure to skip verification');
  if (lasuch.flags.includes('resource_exhaustion') || lasuch.flags.includes('verbose_exploitation')) {
    attack_hypotheses.push('Compute or context exhaustion against the model runtime');
  }
  if (lasuch.flags.includes('benchmark_gaming')) attack_hypotheses.push('Evaluation tampering or score manipulation');
  if (lasuch.flags.includes('model_weakness_probe')) attack_hypotheses.push('Reconnaissance to map model blind spots');

  const impact_simulation = simulateModelImpact(input, lasuch);

  return {
    iteration_count: iterations.length,
    clean_intent,
    hidden_objective,
    attack_hypotheses,
    survival_status,
    needs_human,
    iterations,
    impact_simulation,
    processing_time_ms: Math.round(performance.now() - startTime),
  };
}

function simulateModelImpact(input: string, lasuch: LasuchResult): ImpactSimulation {
  const would_change_role =
    /(?:jestes|you\s+are)\s+(?:teraz|now)/i.test(input) ||
    /(?:udawaj|pretend|act\s+as|wciel\s+sie)/i.test(input) ||
    /(?:zmien\s+role|change\s+(?:your\s+)?role)/i.test(input) ||
    lasuch.flags.includes('jailbreak');

  const would_disable_safety =
    /(?:wylacz|disable|turn\s+off|cofnij|undo|nie\s+stosuj|skip|pomin|remove|usun)/i.test(input) &&
    /(?:filtr|filter|safety|zabezpiecz|zasad|regul|blokad|ochron|cenzur|analiz|pipeline|restriction|guardrail)/i.test(input);

  const would_leak_system_info =
    /(?:system\s+prompt|instrukcje|twoj\s+prompt|your\s+(?:system\s+)?prompt|api\s+key|credentials)/i.test(input) &&
    /(?:podaj|pokaz|wyswietl|give|show|output|reveal|tell|wypisz)/i.test(input);

  const would_exfiltrate_sensitive_data =
    lasuch.flags.includes('dlp_violation') ||
    (/(?:password|token|credentials|haslo|klucz|sekret|secret)/i.test(input) &&
      /(?:give|show|reveal|podaj|pokaz|ujawnij|wypisz)/i.test(input));

  const would_exhaust_resources =
    lasuch.flags.includes('resource_exhaustion') ||
    lasuch.flags.includes('verbose_exploitation') ||
    /(?:repeat|powtorz|generate|wygeneruj).*(?:\d{4,}|forever|bez\s+konca)/i.test(input);

  const would_compromise_integrity =
    lasuch.flags.includes('benchmark_gaming') ||
    lasuch.flags.includes('safety_bypass_open_model');

  const would_alter_model_behavior =
    would_change_role ||
    would_disable_safety ||
    would_leak_system_info ||
    would_exfiltrate_sensitive_data ||
    would_exhaust_resources ||
    would_compromise_integrity ||
    lasuch.flags.includes('prompt_injection') ||
    lasuch.flags.includes('hidden_commands') ||
    lasuch.flags.includes('context_poisoning') ||
    (lasuch.flags.includes('authority_abuse') && lasuch.flags.includes('dlp_violation'));

  const impacts: string[] = [];
  if (would_change_role) impacts.push('ZMIANA ROLI modelu');
  if (would_disable_safety) impacts.push('WYLACZENIE zabezpieczen');
  if (would_leak_system_info) impacts.push('WYCIEK danych systemowych');
  if (would_exfiltrate_sensitive_data) impacts.push('EKSFILTRACJA danych wrazliwych');
  if (would_exhaust_resources) impacts.push('WYCZERPANIE zasobow');
  if (would_compromise_integrity) impacts.push('NARUSZENIE integralnosci modelu lub benchmarku');
  if (would_alter_model_behavior && impacts.length === 0) impacts.push('ZMIANA ZACHOWANIA modelu');

  const severity: ImpactSimulation['severity'] =
    would_alter_model_behavior ? 'critical'
      : lasuch.flags.length > 0 ? 'low'
      : 'none';

  return {
    would_alter_model_behavior,
    would_change_role,
    would_leak_system_info,
    would_disable_safety,
    would_exfiltrate_sensitive_data,
    would_exhaust_resources,
    would_compromise_integrity,
    impact_description: impacts.length > 0
      ? `Symulacja: gdyby to dotarlo do modelu -> ${impacts.join(' + ')}`
      : 'Brak wplywu na model',
    severity,
  };
}
