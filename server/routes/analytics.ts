import { Router } from 'express';
import { requireRole, asyncRoute } from '../auth/middleware';
import { withSession } from '../db';
import { PgAnalyticsStore } from '../coach/pgAnalyticsStore';

export const analyticsRoutes = Router();
analyticsRoutes.use(requireRole('admin'));
analyticsRoutes.get('/', asyncRoute(async (request, response) => {
  const days = Number(request.query.days ?? 30);
  if (days !== 7 && days !== 30 && days !== 90) {
    response.status(400).json({ error: 'Analytics range must be 7, 30, or 90 days.' });
    return;
  }
  const analytics = await withSession(request.sessionHash!, client => new PgAnalyticsStore(client).readDashboard(days));
  response.json(analytics);
}));
