import type { Screenshot } from './screenshots/manifest';
import { searchScreenshots } from './screenshots/manifest';
import type { CoachQueryIntent } from './queryIntent';
import { getCoachWorkflow } from './workflows/registry';

export interface CoachWorkflowResponse {
  content: string;
  domain: string;
  feature: string;
  status: 'live';
  source: string;
  screenshots: Screenshot[];
  retrievalDocumentIds: string[];
}

export function buildCoachWorkflowResponse(
  intent: CoachQueryIntent,
): CoachWorkflowResponse | undefined {
  if (!intent.workflowId) return undefined;
  const workflow = getCoachWorkflow(intent.workflowId);
  if (!workflow) return undefined;
  const translation = intent.language === 'bn' ? workflow.translations?.bn : undefined;
  const feature = translation?.feature ?? workflow.feature;
  const answer = translation?.answer ?? workflow.answer;
  const prerequisites = translation?.prerequisites ?? workflow.prerequisites;
  const steps = translation?.steps ?? workflow.steps;

  const content = [
    answer,
    '',
    ...(prerequisites?.length
      ? [intent.language === 'bn' ? '**শুরু করার আগে**' : '**Before you start**', ...prerequisites.map((item) => `• ${item}`), '']
      : []),
    intent.language === 'bn' ? '**ধাপগুলো**' : '**Steps**',
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n');

  const screenshots = searchScreenshots(intent.resolvedQuery, {
    limit: Math.max(1, workflow.screenshots.length),
  }).map((screenshot) => ({
    ...screenshot,
    caption: translation?.screenshotCaptions[screenshot.src] ?? screenshot.caption,
  }));

  return {
    content,
    domain: workflow.domain,
    feature,
    status: 'live',
    source: workflow.source,
    screenshots,
    retrievalDocumentIds: [`knowledge:${workflow.knowledgeId}`],
  };
}
