// ============================================================
//  ALFA Guardian v2 — Studio Label Definitions
//  Signal dictionaries used by the tagger
// ============================================================

import type { TemporalPartition, StudioLabel } from '@/types/studio-labels';

/**
 * Keyword signal maps for each temporal partition.
 * The tagger scores each partition by counting matched signals.
 */
export const TEMPORAL_SIGNALS: Record<TemporalPartition, string[]> = {
  yesterday: [
    'yesterday', 'last week', 'last month', 'previously', 'before',
    'history', 'historical', 'recall', 'remember', 'past', 'earlier',
    'used to', 'had', 'was', 'were', 'did', 'happened', 'occurred',
    'retrospective', 'review', 'lessons', 'learned', 'what went wrong',
    'what worked', 'old', 'previous', 'prior', 'archive', 'log',
    // Polish
    'wczoraj', 'poprzednio', 'historia', 'wczesniej', 'pamietaj',
    'bylo', 'mielismy', 'stare', 'archiwum', 'retro',
  ],
  today: [
    'now', 'current', 'currently', 'today', 'right now', 'at this moment',
    'this is', 'fix', 'debug', 'run', 'execute', 'do', 'make', 'create',
    'show', 'build', 'analyze', 'check', 'implement', 'write',
    'active', 'ongoing', 'present', 'status', 'working on',
    // Polish
    'dzis', 'teraz', 'aktualnie', 'obecny', 'zrob', 'sprawdz',
    'zbuduj', 'napisz', 'napraw', 'uruchom', 'wykonaj',
  ],
  tomorrow: [
    'tomorrow', 'next week', 'next month', 'plan', 'planning', 'schedule',
    'will', 'should', 'could', 'would', 'future', 'upcoming', 'roadmap',
    'goal', 'target', 'forecast', 'predict', 'estimate', 'propose',
    'what if', 'imagine', 'consider', 'strategy', 'vision', 'idea',
    // Polish
    'jutro', 'plan', 'planowanie', 'przyszlosc', 'cel', 'strategia',
    'prognoza', 'co jesli', 'wyobraz', 'rozważ', 'pomysl', 'wizja',
  ],
};

export const INTENT_SIGNALS: Record<StudioLabel['intent'], string[]> = {
  recall:   ['remember', 'what was', 'show me', 'history', 'log', 'wczoraj', 'historia'],
  analyze:  ['analyze', 'why', 'how does', 'explain', 'understand', 'compare', 'analizuj'],
  execute:  ['run', 'do', 'build', 'create', 'fix', 'write', 'implement', 'zrob', 'uruchom'],
  plan:     ['plan', 'schedule', 'roadmap', 'goal', 'strategy', 'zaplanuj', 'cel'],
  predict:  ['predict', 'forecast', 'what if', 'estimate', 'prognoza', 'co jesli'],
  reflect:  ['review', 'lessons', 'retrospective', 'what went', 'retro', 'podsumuj'],
};

export const DOMAIN_SIGNALS: Record<StudioLabel['domain'], string[]> = {
  code:         ['code', 'function', 'bug', 'class', 'component', 'typescript', 'python', 'kod', 'funkcja'],
  data:         ['data', 'database', 'query', 'analytics', 'metric', 'chart', 'dane', 'baza'],
  creative:     ['design', 'idea', 'story', 'write', 'create', 'art', 'pomysl', 'projekt'],
  ops:          ['deploy', 'server', 'pipeline', 'ci', 'cd', 'docker', 'serwer', 'wdrozenie'],
  research:     ['research', 'study', 'paper', 'article', 'learn', 'badanie', 'artykul'],
  conversation: ['hello', 'hi', 'thanks', 'okay', 'yes', 'no', 'czesc', 'dzieki', 'ok'],
  unknown:      [],
};
