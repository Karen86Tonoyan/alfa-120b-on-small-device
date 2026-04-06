/**
 * FILTRUJĄCY RDZEŃ — Value vs Risk calculator
 * "Is the gain worth the cost?"
 */
import type { LasuchResult, CerberResult, GuardianResult, CoreResult, CoreScores } from '@/types/tonoyan-filters';

function estimateValueScore(input: string): number {
  const wordCount = input.split(/\s+/).length;
  const isQuestion = /\?/.test(input);
  const hasSpecificTopic = /\b(jak|how|co|what|dlaczego|why|kiedy|when|gdzie|where|ile|how much)\b/i.test(input);

  let value = 0.3;
  if (isQuestion) value += 0.2;
  if (hasSpecificTopic) value += 0.2;
  if (wordCount > 5 && wordCount < 50) value += 0.1;
  if (wordCount >= 3 && wordCount <= 100) value += 0.1;

  return Math.min(1, value);
}

export function runCore(
  input: string,
  lasuch: LasuchResult,
  cerber: CerberResult,
  guardian: GuardianResult
): CoreResult {
  const value_score = estimateValueScore(input);
  const risk_score = lasuch.risk_score;
  const trust_score = cerber.survival_status === 'SURVIVED' ? 0.9
    : cerber.survival_status === 'UNCERTAIN' ? 0.4
    : 0.1;
  const confidence_score = lasuch.confidence;
  const uncertainty_score = 1 - confidence_score;

  const scores: CoreScores = {
    value_score: Math.round(value_score * 1000) / 1000,
    risk_score: Math.round(risk_score * 1000) / 1000,
    trust_score: Math.round(trust_score * 1000) / 1000,
    confidence_score: Math.round(confidence_score * 1000) / 1000,
    uncertainty_score: Math.round(uncertainty_score * 1000) / 1000,
  };

  let recommendation: CoreResult['recommendation'];
  let reasoning: string;

  if (risk_score > value_score) {
    recommendation = 'block';
    reasoning = `Risk (${risk_score.toFixed(2)}) > Value (${value_score.toFixed(2)}) — blocking`;
  } else if (uncertainty_score > 0.5) {
    recommendation = 'hold';
    reasoning = `High uncertainty (${uncertainty_score.toFixed(2)}) — holding for review`;
  } else if (value_score < 0.3 && risk_score > 0.3) {
    recommendation = 'silence';
    reasoning = `Low value (${value_score.toFixed(2)}) + medium risk (${risk_score.toFixed(2)}) — silence`;
  } else {
    recommendation = 'pass';
    reasoning = `Value (${value_score.toFixed(2)}) > Risk (${risk_score.toFixed(2)}), confidence OK — pass`;
  }

  return { scores, recommendation, reasoning };
}
