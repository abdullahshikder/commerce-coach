import { searchKnowledge } from '../knowledgeBase';
import { resolveCoachQueryIntent } from '../queryIntent';
import { searchScreenshots } from '../screenshots/manifest';
import { getCoachWorkflowEvaluations, type CoachWorkflowEvaluation } from './registry';

export interface CoachWorkflowEvaluationResult {
  id: string;
  query: string;
  passed: boolean;
  failures: string[];
}

export interface CoachWorkflowEvaluationSummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: CoachWorkflowEvaluationResult[];
}

function comparableText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateCoachWorkflowCase(
  evaluation: CoachWorkflowEvaluation,
): CoachWorkflowEvaluationResult {
  const failures: string[] = [];
  const intent = resolveCoachQueryIntent(evaluation.query);
  const knowledge = searchKnowledge(evaluation.query)[0];
  const screenshots = searchScreenshots(evaluation.query, {
    limit: Math.max(1, evaluation.expectedScreenshotIds.length),
  });

  if (knowledge?.id !== evaluation.expectedKnowledgeId) {
    failures.push(
      `expected knowledge ${evaluation.expectedKnowledgeId}, received ${knowledge?.id ?? 'none'}`,
    );
  }

  if (intent.kind !== 'workflow' || intent.knowledgeId !== evaluation.expectedKnowledgeId) {
    failures.push(
      `expected workflow intent for ${evaluation.expectedKnowledgeId}, received ${intent.id}`,
    );
  }

  const actualScreenshotIds = screenshots.map(({ src }) => src);
  if (JSON.stringify(actualScreenshotIds) !== JSON.stringify(evaluation.expectedScreenshotIds)) {
    failures.push(
      `expected screenshots ${evaluation.expectedScreenshotIds.join(', ') || 'none'}, received ${actualScreenshotIds.join(', ') || 'none'}`,
    );
  }

  const answer = comparableText(knowledge?.answer ?? '');
  for (const phrase of evaluation.requiredAnswerPhrases) {
    if (!answer.includes(comparableText(phrase))) {
      failures.push(`answer is missing required phrase: ${phrase}`);
    }
  }

  return {
    id: evaluation.id,
    query: evaluation.query,
    passed: failures.length === 0,
    failures,
  };
}

export function evaluateCoachWorkflows(): CoachWorkflowEvaluationSummary {
  const results = getCoachWorkflowEvaluations().map(evaluateCoachWorkflowCase);
  const passedCount = results.filter(({ passed }) => passed).length;
  return {
    passed: passedCount === results.length,
    total: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    results,
  };
}

export function formatCoachWorkflowEvaluation(summary: CoachWorkflowEvaluationSummary): string {
  const lines = summary.results.map((result) => {
    if (result.passed) return `PASS ${result.id}: ${result.query}`;
    return [
      `FAIL ${result.id}: ${result.query}`,
      ...result.failures.map((failure) => `  - ${failure}`),
    ].join('\n');
  });
  lines.push(`\n${summary.passedCount}/${summary.total} Coach workflow evaluations passed.`);
  return lines.join('\n');
}
