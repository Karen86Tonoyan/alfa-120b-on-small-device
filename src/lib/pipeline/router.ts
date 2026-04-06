import type { GuardianRouteDecision, GuardianTaggerResult } from '@/types/tonoyan-filters';

const MODEL_BY_PARTITION: Record<GuardianTaggerResult['partition'], GuardianRouteDecision['model_tier']> = {
  yesterday: 'model_a',
  today: 'model_b',
  tomorrow: 'model_c',
};

const LANE_BY_PARTITION: Record<GuardianTaggerResult['partition'], string> = {
  yesterday: 'recall-lane',
  today: 'execution-lane',
  tomorrow: 'planning-lane',
};

export function routeTaggedMessage(tagger: GuardianTaggerResult): GuardianRouteDecision {
  const model_tier = MODEL_BY_PARTITION[tagger.partition];
  const lane = `${LANE_BY_PARTITION[tagger.partition]}:${tagger.domain}`;

  const execution_profile =
    tagger.partition === 'yesterday'
      ? 'context-retrieval'
      : tagger.partition === 'tomorrow'
        ? 'forward-planning'
        : tagger.intent === 'execute'
          ? 'live-execution'
          : 'interactive-analysis';

  const should_dispatch = !['hold', 'freeze'].includes(tagger.control);
  const priority =
    tagger.signals.includes('urgency') || tagger.control === 'freeze'
      ? 'high'
      : tagger.partition === 'tomorrow'
        ? 'low'
        : 'medium';

  return {
    partition: tagger.partition,
    lane,
    model_tier,
    execution_profile,
    should_dispatch,
    priority,
  };
}
