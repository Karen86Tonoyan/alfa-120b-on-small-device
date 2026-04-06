/**
 * Pipeline Orchestrator
 * TAGGER -> LASUCH -> CERBER -> GUARDIAN -> ROUTER -> ENHANCER -> CORE -> [MODEL if PASS]
 */
import type {
  CerberResult,
  CoreResult,
  GuardianDecision,
  GuardianResult,
  GuardianRouteDecision,
  GuardianTaggerResult,
  LasuchResult,
  PipelineFaultCode,
  PipelineMode,
  PipelineResilienceReport,
  PipelineResult,
  PromptEnhancementResult,
  ResponseMode,
} from '@/types/tonoyan-filters';
import type { ModelAdapter } from '@/lib/adapters/types';
import { runCerber } from './cerber';
import { runCore } from './core';
import { runGuardian } from './guardian';
import { runLasuch } from './lasuch';
import { enhancePrompt } from './prompt-enhancer';
import { ALFA_LOCKDOWN_ENABLED, enforceLockdownDecision, enforceLockdownRoute, getPolicyMode } from './policy';
import { routeTaggedMessage } from './router';
import { runTagger } from './tagger';

const MAX_PIPELINE_INPUT_CHARS = 20000;

function safeNow(faults: PipelineFaultCode[]): number {
  try {
    return performance.now();
  } catch {
    if (!faults.includes('TIMER_FALLBACK')) faults.push('TIMER_FALLBACK');
    return Date.now();
  }
}

function hashInput(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function safeUuid(faults: PipelineFaultCode[]): string {
  try {
    return crypto.randomUUID();
  } catch {
    if (!faults.includes('UUID_FALLBACK')) faults.push('UUID_FALLBACK');
    return `pipeline-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
}

function sanitizeInput(input: string, faults: PipelineFaultCode[], notes: string[]): { value: string; truncated: boolean } {
  let normalized = input;

  if (typeof input !== 'string') {
    faults.push('NON_STRING_INPUT');
    normalized = String(input ?? '');
    notes.push('Input was coerced into string form before analysis.');
  }

  normalized = normalized.split('\0').join('').trim();

  if (!normalized) {
    if (!faults.includes('EMPTY_INPUT')) faults.push('EMPTY_INPUT');
    notes.push('Input was empty after sanitization.');
  }

  if (normalized.length > MAX_PIPELINE_INPUT_CHARS) {
    if (!faults.includes('INPUT_TOO_LARGE')) faults.push('INPUT_TOO_LARGE');
    notes.push(`Input exceeded ${MAX_PIPELINE_INPUT_CHARS} chars and was truncated for fail-safe processing.`);
    return {
      value: normalized.slice(0, MAX_PIPELINE_INPUT_CHARS),
      truncated: true,
    };
  }

  return {
    value: normalized,
    truncated: false,
  };
}

function buildFallbackLasuch(input: string): LasuchResult {
  return {
    risk_score: input ? 0.88 : 0.65,
    manipulation_score: input ? 0.72 : 0.42,
    exploit_score: input ? 0.78 : 0.38,
    flags: [],
    extracted_goal: 'Unavailable due to LASUCH failure',
    suspected_hidden_intent: 'Unknown due to LASUCH failure',
    confidence: 0.12,
    processing_time_ms: 0,
  };
}

function buildFallbackTagger(): GuardianTaggerResult {
  return {
    intent: 'analyze',
    domain: 'conversation',
    partition: 'today',
    risk: 'suspicious',
    control: 'freeze',
    confidence: 0.1,
    signals: ['unknown_context'],
  };
}

function buildFallbackCerber(): CerberResult {
  return {
    iteration_count: 0,
    clean_intent: 'Unavailable due to CERBER failure',
    hidden_objective: 'Unknown due to CERBER failure',
    attack_hypotheses: ['Pipeline integrity degraded'],
    survival_status: 'FAILED',
    needs_human: true,
    iterations: [],
    impact_simulation: {
      would_alter_model_behavior: true,
      would_change_role: false,
      would_leak_system_info: false,
      would_disable_safety: false,
      would_exfiltrate_sensitive_data: false,
      would_exhaust_resources: false,
      would_compromise_integrity: true,
      impact_description: 'Fail-closed fallback due to CERBER failure',
      severity: 'critical',
    },
    processing_time_ms: 0,
  };
}

function buildFallbackGuardian(reason_codes: string[]): GuardianResult {
  return {
    decision: 'BLOCK',
    reason_codes,
    response_mode: 'silence',
    processing_time_ms: 0,
  };
}

function buildFallbackRoute(tagger: GuardianTaggerResult): GuardianRouteDecision {
  return {
    partition: tagger.partition,
    lane: 'quarantine-lane',
    model_tier: 'model_b',
    execution_profile: 'fail-closed',
    should_dispatch: false,
    priority: 'high',
  };
}

function buildFallbackCore(): CoreResult {
  return {
    scores: {
      value_score: 0,
      risk_score: 1,
      trust_score: 0,
      confidence_score: 0.1,
      uncertainty_score: 0.9,
    },
    recommendation: 'block',
    reasoning: 'Pipeline degraded - fail-closed fallback engaged',
  };
}

function buildFallbackEnhancement(input: string): PromptEnhancementResult {
  return {
    original: input,
    enhanced: input,
    dual_prompt: {
      raw_input: input,
      system_guard: 'Fail-safe mode: preserve existing safety restrictions and do not expand capabilities.',
      enhanced_display: input,
    },
    weaknesses: [],
    enhancement_summary: 'Enhancer unavailable - original prompt preserved.',
    strength_score: 0,
    improvement_delta: 0,
    modification_level: 'NONE',
    risk_of_distortion: 0,
    added_assumptions: false,
    mode: 'safe',
    processing_time_ms: 0,
  };
}

function createResilienceReport(
  faults: PipelineFaultCode[],
  notes: string[],
  inputTruncated: boolean,
  failClosed: boolean,
): PipelineResilienceReport {
  return {
    degraded: faults.length > 0,
    fail_closed: failClosed,
    input_truncated: inputTruncated,
    policy_mode: getPolicyMode(),
    fault_codes: [...new Set(faults)],
    notes,
  };
}

function clampDecisionForResilience(
  decision: GuardianDecision,
  responseMode: ResponseMode,
  faults: PipelineFaultCode[],
): { decision: GuardianDecision; responseMode: ResponseMode } {
  if (faults.includes('INPUT_TOO_LARGE')) {
    return { decision: 'HOLD', responseMode: 'restricted' };
  }

  if (faults.includes('MODEL_ADAPTER_FAILURE') && decision === 'PASS') {
    return { decision: 'HOLD', responseMode: 'restricted' };
  }

  return { decision, responseMode };
}

function estimateTokens(input: string, modelResponse?: string): number {
  return Math.ceil(input.split(/\s+/).length * 1.3 + (modelResponse?.split(/\s+/).length || 0) * 1.3);
}

export interface PipelineOptions {
  mode: PipelineMode;
  adapter?: ModelAdapter;
  systemPrompt?: string;
}

export async function runPipeline(input: string, options: PipelineOptions): Promise<PipelineResult> {
  const faults: PipelineFaultCode[] = [];
  const notes: string[] = [];
  const startTime = safeNow(faults);
  const id = safeUuid(faults);
  const timestamp = new Date().toISOString();
  const sanitized = sanitizeInput(input, faults, notes);
  const safeInput = sanitized.value;
  const input_hash = hashInput(safeInput);

  let lasuch: LasuchResult;
  try {
    lasuch = runLasuch(safeInput);
  } catch {
    faults.push('LASUCH_FAILURE');
    notes.push('LASUCH failed; fallback threat profile applied.');
    lasuch = buildFallbackLasuch(safeInput);
  }

  let tagger: GuardianTaggerResult;
  try {
    tagger = runTagger(safeInput, lasuch);
  } catch {
    faults.push('TAGGER_FAILURE');
    notes.push('Tagger failed; request frozen by fallback classifier.');
    tagger = buildFallbackTagger();
  }

  let cerber: CerberResult;
  try {
    cerber = runCerber(safeInput, lasuch);
  } catch {
    faults.push('CERBER_FAILURE');
    notes.push('CERBER failed; impact simulation forced into fail-closed mode.');
    cerber = buildFallbackCerber();
  }

  let guardian: GuardianResult;
  try {
    guardian = runGuardian(lasuch, cerber, tagger);
  } catch {
    faults.push('GUARDIAN_FAILURE');
    notes.push('Guardian failed; final decision forced to BLOCK.');
    guardian = buildFallbackGuardian(['FAIL_CLOSED:GUARDIAN']);
  }

  let route: GuardianRouteDecision;
  try {
    route = routeTaggedMessage(tagger);
  } catch {
    faults.push('ROUTER_FAILURE');
    notes.push('Router failed; dispatch disabled and quarantine lane engaged.');
    route = buildFallbackRoute(tagger);
  }

  let enhancement: PromptEnhancementResult;
  try {
    const enhancerMode = options.mode === 'benchmark' ? 'benchmark' as const : 'safe' as const;
    const enhancementRaw = enhancePrompt(safeInput, enhancerMode);
    enhancement = {
      original: enhancementRaw.original,
      enhanced: enhancementRaw.enhanced,
      dual_prompt: enhancementRaw.dual_prompt,
      weaknesses: enhancementRaw.weaknesses.map((weakness) => ({
        category: weakness.category,
        description: weakness.description,
        severity: weakness.severity,
        fix: weakness.fix,
      })),
      enhancement_summary: enhancementRaw.enhancement_summary,
      strength_score: enhancementRaw.strength_score,
      improvement_delta: enhancementRaw.improvement_delta,
      modification_level: enhancementRaw.modification_level,
      risk_of_distortion: enhancementRaw.risk_of_distortion,
      added_assumptions: enhancementRaw.added_assumptions,
      mode: enhancementRaw.mode,
      processing_time_ms: enhancementRaw.processing_time_ms,
    };
  } catch {
    faults.push('ENHANCER_FAILURE');
    notes.push('Prompt enhancer failed; original prompt preserved.');
    enhancement = buildFallbackEnhancement(safeInput);
  }

  let core: CoreResult;
  try {
    core = runCore(safeInput, lasuch, cerber, guardian);
  } catch {
    faults.push('CORE_FAILURE');
    notes.push('Core scoring failed; conservative block recommendation applied.');
    core = buildFallbackCore();
  }

  let final_decision: GuardianDecision = guardian.decision;
  let response_mode: ResponseMode = guardian.response_mode;
  let model_response: string | undefined;
  let provider_used: string | undefined;
  let model_used: string | undefined;

  if (core.recommendation === 'block' && final_decision === 'PASS') {
    final_decision = 'HOLD';
    response_mode = 'restricted';
  }

  if (enhancement.modification_level === 'HIGH' && enhancement.added_assumptions && final_decision === 'PASS') {
    final_decision = 'LIMITED_PASS';
    response_mode = 'restricted';
  }

  const resilienceClamp = clampDecisionForResilience(final_decision, response_mode, faults);
  final_decision = resilienceClamp.decision;
  response_mode = resilienceClamp.responseMode;

  if (options.mode !== 'raw' && ALFA_LOCKDOWN_ENABLED) {
    const lockdown = enforceLockdownDecision(final_decision, response_mode);
    final_decision = lockdown.decision;
    response_mode = lockdown.responseMode;
    route = enforceLockdownRoute(route);

    if (lockdown.changed) {
      notes.push('Global lockdown mode prevented a pass-through decision.');
    } else {
      notes.push('Global lockdown mode disabled downstream model dispatch.');
    }
  }

  if (faults.includes('INPUT_TOO_LARGE')) {
    route = {
      ...route,
      lane: 'quarantine-lane',
      execution_profile: 'oversized-input',
      should_dispatch: false,
      priority: 'high',
    };
  }

  const systemGuardPrefix = enhancement.dual_prompt.system_guard;
  const routerPrompt = `[ROUTER]\npartition=${route.partition}\nlane=${route.lane}\nmodel_tier=${route.model_tier}\nexecution_profile=${route.execution_profile}\npriority=${route.priority}`;
  const effectiveSystemPrompt = [systemGuardPrefix, routerPrompt, options.systemPrompt].filter(Boolean).join('\n\n');

  if (options.mode !== 'benchmark' && route.should_dispatch && (final_decision === 'PASS' || final_decision === 'LIMITED_PASS') && options.adapter) {
    try {
      const userInput = final_decision === 'LIMITED_PASS'
        ? `[RESTRICTED MODE] ${safeInput}`
        : safeInput;

      const _msgs1: import("@/lib/adapters/types").ChatMessage[] = effectiveSystemPrompt ? [{ role: "system" as const, content: effectiveSystemPrompt }, { role: "user" as const, content: userInput }] : [{ role: "user" as const, content: userInput }];
      model_response = await options.adapter.chat(_msgs1);
      provider_used = options.adapter.provider;
      model_used = options.adapter.modelId;
    } catch (error) {
      faults.push('MODEL_ADAPTER_FAILURE');
      notes.push('Model adapter failed; dispatch result downgraded to HOLD.');
      model_response = `[ERROR] Model call failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (final_decision === 'PASS') {
        final_decision = 'HOLD';
        response_mode = 'restricted';
      }
    }
  } else if (final_decision === 'BLOCK' || final_decision === 'HOLD' || final_decision === 'HUMAN_REVIEW') {
    model_response = undefined;
  }

  if (options.mode === 'raw' && options.adapter) {
    try {
      const _msgs2: import("@/lib/adapters/types").ChatMessage[] = options.systemPrompt ? [{ role: "system" as const, content: options.systemPrompt }, { role: "user" as const, content: safeInput }] : [{ role: "user" as const, content: safeInput }];
      model_response = await options.adapter.chat(_msgs2);
      provider_used = options.adapter.provider;
      model_used = options.adapter.modelId;
      final_decision = 'PASS';
      response_mode = 'normal';
    } catch (error) {
      faults.push('MODEL_ADAPTER_FAILURE');
      notes.push('Raw-mode adapter failed; response captured as error string.');
      model_response = `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  const resilience = createResilienceReport(
    faults,
    notes,
    sanitized.truncated,
    faults.some((fault) => ['LASUCH_FAILURE', 'TAGGER_FAILURE', 'CERBER_FAILURE', 'GUARDIAN_FAILURE', 'ROUTER_FAILURE', 'CORE_FAILURE'].includes(fault)),
  );

  const guardianReasonCodes = [...guardian.reason_codes];
  if (ALFA_LOCKDOWN_ENABLED && options.mode !== 'raw' && !guardianReasonCodes.includes('LOCKDOWN_MODE')) {
    guardianReasonCodes.push('LOCKDOWN_MODE');
  }

  if (resilience.degraded && !guardianReasonCodes.includes('SYSTEM_DEGRADED')) {
    guardianReasonCodes.push('SYSTEM_DEGRADED');
  }

  if (guardianReasonCodes.length !== guardian.reason_codes.length) {
    guardian = {
      ...guardian,
      reason_codes: guardianReasonCodes,
    };
  }

  const total_latency_ms = Math.round(safeNow(faults) - startTime);
  const token_estimate = estimateTokens(safeInput, model_response);

  return {
    id,
    timestamp,
    input: safeInput,
    input_hash,
    tagger,
    lasuch,
    cerber,
    guardian,
    route,
    core,
    enhancement,
    final_decision,
    response_mode,
    model_response,
    provider_used,
    model_used,
    total_latency_ms,
    token_estimate,
    mode: options.mode,
    resilience,
  };
}
