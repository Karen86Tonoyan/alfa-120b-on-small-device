export interface DetectionContext {
  raw: string;
  lower: string;
  normalized: string;
  compact: string;
  flat: string;
  tokens: string[];
  wordCount: number;
  numbers: number[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase();
}

export function createDetectionContext(input: string): DetectionContext {
  const normalized = normalizeText(input);
  const compact = normalized.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const numbers = [...compact.matchAll(/\b\d+\b/g)].map((match) => Number(match[0]));

  return {
    raw: input,
    lower: input.toLowerCase(),
    normalized,
    compact,
    flat: compact.replace(/\s+/g, ''),
    tokens: compact ? compact.split(' ') : [],
    wordCount: compact ? compact.split(' ').length : 0,
    numbers,
  };
}

export function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

export function includesAll(text: string, phrases: string[]): boolean {
  return phrases.every((phrase) => text.includes(phrase));
}

export function hasLoosePhrase(context: DetectionContext, phrase: string): boolean {
  const parts = phrase
    .split(/\s+/)
    .map((part) => escapeRegExp(part))
    .filter(Boolean);

  if (parts.length === 0) return false;

  const pattern = new RegExp(parts.join('[^a-z0-9]*'), 'i');
  return pattern.test(context.normalized);
}

export function hasNearTerms(context: DetectionContext, groupA: string[], groupB: string[], maxDistance = 6): boolean {
  const positionsA = context.tokens
    .map((token, index) => (groupA.includes(token) ? index : -1))
    .filter((index) => index >= 0);
  const positionsB = context.tokens
    .map((token, index) => (groupB.includes(token) ? index : -1))
    .filter((index) => index >= 0);

  return positionsA.some((a) => positionsB.some((b) => Math.abs(a - b) <= maxDistance));
}

export function countMatches(text: string, expressions: RegExp[]): number {
  return expressions.reduce((sum, expression) => sum + (expression.test(text) ? 1 : 0), 0);
}
