import {
  KNOWLEDGE_BASE,
  type KnowledgeItem,
} from '../knowledgeBase';
import {
  SCREENSHOT_REGISTRY,
  type ScreenshotSet,
} from '../screenshots/manifest';
import type { EmbeddingDocument, EmbeddingMetadataValue } from './types';

function appendList(lines: string[], label: string, values?: string[]): void {
  if (values && values.length > 0) lines.push(`${label}: ${values.join(' | ')}`);
}

export function buildKnowledgeEmbeddingDocuments(
  items: readonly KnowledgeItem[] = KNOWLEDGE_BASE,
): EmbeddingDocument[] {
  return items.map((item) => {
    const lines = [
      `Feature: ${item.feature}`,
      `Domain: ${item.domain}`,
      `Question: ${item.question}`,
      `Answer: ${item.answer}`,
      `Keywords: ${item.keywords.join(', ')}`,
    ];

    for (const [language, translation] of Object.entries(item.translations ?? {})) {
      lines.push(`Question (${language}): ${translation.question}`);
      lines.push(`Answer (${language}): ${translation.answer}`);
    }

    appendList(lines, 'Prerequisites', item.prerequisites);
    appendList(lines, 'Steps', item.steps);
    appendList(lines, 'How it works', item.howItWorks);
    appendList(lines, 'Edge cases', item.edgeCases);
    appendList(lines, 'CX notes', item.cxNotes);
    if (item.merchantCommunication) lines.push(`Merchant communication: ${item.merchantCommunication}`);
    lines.push(`Status: ${item.status}`, `Source: ${item.source}`);

    const metadata: Record<string, EmbeddingMetadataValue> = {
      knowledgeId: item.id,
      domain: item.domain,
      feature: item.feature,
      status: item.status,
      source: item.source,
      keywords: [...item.keywords],
    };
    if (item.screenshotIds?.length) metadata.screenshotIds = [...item.screenshotIds];

    return {
      id: `knowledge:${item.id}`,
      kind: 'knowledge',
      text: lines.join('\n'),
      metadata,
    };
  });
}

export function buildScreenshotEmbeddingDocuments(
  guides: readonly ScreenshotSet[] = SCREENSHOT_REGISTRY,
): EmbeddingDocument[] {
  return guides.flatMap((guide) =>
    guide.screenshots.map((screenshot) => ({
      id: `screenshot:${guide.featureId}:${screenshot.src}`,
      kind: 'screenshot' as const,
      text: [
        `Feature: ${guide.feature}`,
        `Screenshot: ${screenshot.caption}`,
        `Search terms: ${guide.keywords.join(', ')}`,
        ...(screenshot.step ? [`Workflow step: ${screenshot.step}`] : []),
      ].join('\n'),
      metadata: {
        featureId: guide.featureId,
        feature: guide.feature,
        image: screenshot.src,
        caption: screenshot.caption,
        keywords: [...guide.keywords],
        ...(screenshot.step ? { step: screenshot.step } : {}),
      },
    })),
  );
}

export function buildCoachEmbeddingDocuments(): EmbeddingDocument[] {
  return [
    ...buildKnowledgeEmbeddingDocuments(),
    ...buildScreenshotEmbeddingDocuments(),
  ];
}
