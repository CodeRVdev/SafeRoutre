import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export async function getAnalytics(req: Request, res: Response) {
  try {
    const range = (req.query.range as '7d' | '30d' | 'all') || '30d';
    const data = await AnalyticsService.getAnalytics(range);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error in getAnalytics controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching analytics data.',
    });
  }
}
