import { Router } from 'express';
import { requireRole, asyncRoute } from '../auth/middleware';
import { withSession } from '../db';
import { PgAnalyticsStore } from '../coach/pgAnalyticsStore';
import { PgTrainingDataStore, trainingDatasetJsonl, type TrainingDataRange } from '../coach/trainingData';

export const analyticsRoutes = Router();
analyticsRoutes.use(requireRole('admin'));

function trainingRange(value: unknown): TrainingDataRange | undefined {
  if (value === 'all') return null;
  const days = Number(value ?? 365);
  return days === 30 || days === 90 || days === 365 ? days : undefined;
}

async function trainingDataset(sessionHash: string, range: TrainingDataRange) {
  return withSession(sessionHash, client => new PgTrainingDataStore(client).build(range));
}

analyticsRoutes.get('/training-data', asyncRoute(async (request, response) => {
  const range = trainingRange(request.query.days);
  if (range === undefined) {
    response.status(400).json({ error: 'Training-data range must be 30, 90, 365, or all.' });
    return;
  }
  const dataset = await trainingDataset(request.sessionHash!, range);
  response.json({
    version: dataset.version,
    examples: dataset.examples.length,
    sourceRows: dataset.sourceRows,
    duplicateRows: dataset.duplicateRows,
    redactionCount: dataset.redactionCount,
    approvedCorrections: dataset.approvedCorrections,
    helpfulAnswers: dataset.helpfulAnswers,
    trainExamples: dataset.trainExamples,
    validationExamples: dataset.validationExamples,
    truncated: dataset.truncated,
  });
}));

analyticsRoutes.get('/training-data/export', asyncRoute(async (request, response) => {
  const range = trainingRange(request.query.days);
  if (range === undefined) {
    response.status(400).json({ error: 'Training-data range must be 30, 90, 365, or all.' });
    return;
  }
  const dataset = await trainingDataset(request.sessionHash!, range);
  response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="commerce-coach-${dataset.version}.jsonl"`);
  response.setHeader('X-Coach-Dataset-Version', dataset.version);
  response.setHeader('X-Coach-Training-Examples', String(dataset.examples.length));
  response.setHeader('X-Coach-Training-Redactions', String(dataset.redactionCount));
  response.setHeader('X-Coach-Training-Truncated', String(dataset.truncated));
  response.send(trainingDatasetJsonl(dataset));
}));

analyticsRoutes.get('/', asyncRoute(async (request, response) => {
  const days = Number(request.query.days ?? 30);
  if (days !== 7 && days !== 30 && days !== 90) {
    response.status(400).json({ error: 'Analytics range must be 7, 30, or 90 days.' });
    return;
  }
  const analytics = await withSession(request.sessionHash!, client => new PgAnalyticsStore(client).readDashboard(days));
  response.json(analytics);
}));
