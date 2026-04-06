/**
 * GUARDIAN - Final decision layer
 */
import type { CerberResult, GuardianDecision, GuardianResult, GuardianTaggerResult, LasuchResult, ResponseMode } from '@/types/tonoyan-filters';

const HARD_BLOCK_FLAGS = new Set([
  'prompt_injection',
  'jailbreak',
  'hidden_commands',
  'context_poisoning',
  'dlp_violation',
  'resource_exhaustion',
  'benchmark_gaming',
  'verbose_exploitation',
  'safety_bypass_open_model',
]);

const COERCIVE_BLOCK_CLUSTERS = [
  ['darvo', 'gaslighting'],
  ['smear_campaign', 'projection'],
  ['isolation', 'toxic_relationship'],
  ['parasitic_demand', 'guilt_tripping'],
  ['fog_coercion', 'guilt_tripping'],
  ['emotional_manipulation', 'grooming'],
  ['authority_abuse', 'prompt_injection'],
  ['gaslighting', 'dissonance_masking'],
];

function hasCluster(flags: string[], cluster: string[]): boolean {
  return cluster.every((flag) => flags.includes(flag));
}

export function runGuardian(lasuch: LasuchResult, cerber: CerberResult, tagger: GuardianTaggerResult): GuardianResult {
  const startTime = performance.now();
  const reason_codes: string[] = [];
  let decision: GuardianDecision;
  let response_mode: ResponseMode;

  const sim = cerber.impact_simulation;
  if (sim.severity === 'critical') {
    if (sim.would_disable_safety) reason_codes.push('SIM:DISABLE_SAFETY');
    if (sim.would_change_role) reason_codes.push('SIM:CHANGE_ROLE');
    if (sim.would_leak_system_info) reason_codes.push('SIM:LEAK_SYSTEM');
    if (sim.would_exfiltrate_sensitive_data) reason_codes.push('SIM:EXFILTRATION');
    if (sim.would_exhaust_resources) reason_codes.push('SIM:RESOURCE_EXHAUSTION');
    if (sim.would_compromise_integrity) reason_codes.push('SIM:INTEGRITY_COMPROMISE');
    if (sim.would_alter_model_behavior) reason_codes.push('SIM:ALTER_BEHAVIOR');
    reason_codes.push(`SIM:${sim.impact_description}`);

    return {
      decision: 'BLOCK',
      reason_codes,
      response_mode: 'silence',
      processing_time_ms: Math.round(performance.now() - startTime),
    };
  }

  const exploitFlags = lasuch.flags.filter((flag) => HARD_BLOCK_FLAGS.has(flag));
  const coerciveClusterHit = COERCIVE_BLOCK_CLUSTERS.some((cluster) => hasCluster(lasuch.flags, cluster));
  const hardManipulation =
    lasuch.flags.includes('dependency_loop_attack') ||
    (lasuch.flags.includes('fog_coercion') && lasuch.manipulation_score > 0.58);
  const holdTactic =
    lasuch.flags.includes('broda_tactic') ||
    lasuch.flags.includes('hoovering') ||
    lasuch.flags.includes('jade_trap') ||
    (lasuch.flags.includes('hidden_intent') && lasuch.flags.includes('pseudo_authority')) ||
    (lasuch.flags.includes('model_weakness_probe') && lasuch.flags.length === 1);

  if (lasuch.risk_score > 0.6) reason_codes.push(`HIGH_RISK:${lasuch.risk_score.toFixed(2)}`);
  if (lasuch.manipulation_score > 0.55) reason_codes.push(`HIGH_MANIPULATION:${lasuch.manipulation_score.toFixed(2)}`);
  if (lasuch.exploit_score > 0.55) reason_codes.push(`HIGH_EXPLOIT:${lasuch.exploit_score.toFixed(2)}`);
  reason_codes.push(`TAGGER:RISK:${tagger.risk}`);
  reason_codes.push(`TAGGER:CONTROL:${tagger.control}`);
  if (tagger.signals.length > 0) reason_codes.push(`TAGGER:SIGNALS:${tagger.signals.join(',')}`);
  if (cerber.survival_status === 'FAILED') reason_codes.push('CERBER_FAILED');
  if (cerber.survival_status === 'UNCERTAIN' && cerber.iteration_count >= 5) reason_codes.push('CERBER_UNCERTAIN_MAX_ITER');
  if (lasuch.confidence < 0.5) reason_codes.push(`LOW_CONFIDENCE:${lasuch.confidence.toFixed(2)}`);
  if (exploitFlags.length > 0) reason_codes.push(`EXPLOIT_FLAGS:${exploitFlags.join(',')}`);
  if (lasuch.flags.length >= 3) reason_codes.push(`MULTI_FLAG:${lasuch.flags.length}`);
  if (coerciveClusterHit) reason_codes.push('COERCIVE_CLUSTER');
  if (hardManipulation) reason_codes.push('HARD_MANIPULATION');
  if (holdTactic) reason_codes.push('TACTICAL_HOLD');
  if (cerber.needs_human) reason_codes.push('NEEDS_HUMAN');

  const hasExploit = exploitFlags.length > 0;
  const weaknessProbeOnly = lasuch.flags.length === 1 && lasuch.flags.includes('model_weakness_probe');
  const highRisk = lasuch.risk_score > 0.6;
  const highManip = lasuch.manipulation_score > 0.55;
  const highExploit = lasuch.exploit_score > 0.55 && !weaknessProbeOnly;
  const cerberFailed = cerber.survival_status === 'FAILED';
  const cerberUncertain = cerber.survival_status === 'UNCERTAIN';
  const needsHuman = cerber.needs_human;
  const lowConfidence = lasuch.confidence < 0.5;
  const multiFlag = lasuch.flags.length >= 3;
  const taggerFreeze = tagger.control === 'freeze';
  const taggerHold = tagger.control === 'hold';
  const taggerRestrict = tagger.control === 'restrict' || tagger.control === 'review';
  const taggerExploit = tagger.risk === 'exploit_attempt';
  const taggerManipulative = tagger.risk === 'manipulative';

  if (
    taggerFreeze ||
    taggerExploit ||
    hasExploit ||
    highExploit ||
    cerberFailed ||
    (highRisk && highManip) ||
    (highRisk && multiFlag) ||
    coerciveClusterHit ||
    hardManipulation
  ) {
    decision = 'BLOCK';
    response_mode = 'silence';
  } else if (needsHuman || (cerberUncertain && cerber.iteration_count >= 5)) {
    decision = 'HUMAN_REVIEW';
    response_mode = 'handoff';
  } else if (taggerHold || taggerManipulative || highRisk || highManip || holdTactic) {
    decision = 'HOLD';
    response_mode = 'restricted';
  } else if (taggerRestrict || lowConfidence || cerberUncertain || lasuch.flags.length > 0) {
    decision = 'LIMITED_PASS';
    response_mode = 'restricted';
  } else {
    decision = 'PASS';
    response_mode = 'normal';
  }

  if (lasuch.flags.length === 0 && cerber.survival_status === 'SURVIVED' && lasuch.confidence > 0.8 && sim.severity === 'none') {
    decision = 'PASS';
    response_mode = 'normal';
    if (reason_codes.length === 0) reason_codes.push('CLEAN');
  }

  return {
    decision,
    reason_codes,
    response_mode,
    processing_time_ms: Math.round(performance.now() - startTime),
  };
}
