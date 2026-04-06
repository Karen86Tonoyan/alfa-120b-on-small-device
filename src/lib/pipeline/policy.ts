import type { GuardianDecision, GuardianRouteDecision, ResponseMode } from '@/types/tonoyan-filters';

export const ALFA_LOCKDOWN_ENABLED = true;

export function getPolicyMode(): 'adaptive' | 'lockdown' {
  return ALFA_LOCKDOWN_ENABLED ? 'lockdown' : 'adaptive';
}

export function getPolicyExpectedDecision(decision: GuardianDecision): GuardianDecision {
  if (!ALFA_LOCKDOWN_ENABLED) return decision;

  if (decision === 'PASS' || decision === 'LIMITED_PASS') {
    return 'HOLD';
  }

  return decision;
}

export function enforceLockdownDecision(
  decision: GuardianDecision,
  responseMode: ResponseMode,
): { decision: GuardianDecision; responseMode: ResponseMode; changed: boolean } {
  if (!ALFA_LOCKDOWN_ENABLED) {
    return { decision, responseMode, changed: false };
  }

  if (decision === 'PASS' || decision === 'LIMITED_PASS') {
    return {
      decision: 'HOLD',
      responseMode: 'restricted',
      changed: true,
    };
  }

  return { decision, responseMode, changed: false };
}

export function enforceLockdownRoute(route: GuardianRouteDecision): GuardianRouteDecision {
  if (!ALFA_LOCKDOWN_ENABLED) return route;

  return {
    ...route,
    lane: `lockdown:${route.lane}`,
    execution_profile: 'lockdown',
    should_dispatch: false,
    priority: 'high',
  };
}
