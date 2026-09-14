import pool from '../config/db';

export interface AnalyticsData {
  kpis: {
    total_alerts: number;
    drill_alerts_count: number;
    real_alerts_count: number;
    avg_response_time_minutes: number;
    avg_drill_response_time_minutes: number;
    avg_real_response_time_minutes: number;
    overall_completion_rate: number;
    total_hazards: number;
  };
  response_times: Array<{
    alert_id: number;
    title: string;
    sent_date: string;
    avg_minutes: number;
    total_checkins: number;
    is_drill: boolean;
  }>;
  status_breakdown: Array<{
    status: 'safe' | 'need_help' | 'injured';
    count: number;
  }>;
  role_rates: Array<{
    role: string;
    total_users: number;
    checked_in_users: number;
    rate: number;
  }>;
  alert_history: Array<{
    date_label: string;
    total_alerts: number;
    drill_alerts: number;
    real_alerts: number;
  }>;
  hazard_frequency: Array<{
    type: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    count: number;
  }>;
}

export class AnalyticsService {
  static async getAnalytics(range: '7d' | '30d' | 'all' = '30d'): Promise<AnalyticsData> {
    let alertIntervalClause = '1=1';
    let hazardIntervalClause = '1=1';

    if (range === '7d') {
      alertIntervalClause = `sent_at >= NOW() - INTERVAL '7 days'`;
      hazardIntervalClause = `created_at >= NOW() - INTERVAL '7 days'`;
    } else if (range === '30d') {
      alertIntervalClause = `sent_at >= NOW() - INTERVAL '30 days'`;
      hazardIntervalClause = `created_at >= NOW() - INTERVAL '30 days'`;
    }

    // 1. KPIs (Overall, Drill, and Real Emergency breakdown)
    const alertsRes = await pool.query(
      `SELECT 
         COUNT(*)::int AS total_count,
         COUNT(CASE WHEN is_drill = TRUE THEN 1 END)::int AS drill_count,
         COUNT(CASE WHEN is_drill = FALSE OR is_drill IS NULL THEN 1 END)::int AS real_count
       FROM alerts WHERE ${alertIntervalClause}`
    );
    const totalAlerts = alertsRes.rows[0]?.total_count || 0;
    const drillAlertsCount = alertsRes.rows[0]?.drill_count || 0;
    const realAlertsCount = alertsRes.rows[0]?.real_count || 0;

    const avgTimeRes = await pool.query(
      `SELECT 
         COALESCE(AVG(EXTRACT(EPOCH FROM (c.checked_in_at - a.sent_at)) / 60), 0)::float AS avg_overall,
         COALESCE(AVG(CASE WHEN a.is_drill = TRUE THEN EXTRACT(EPOCH FROM (c.checked_in_at - a.sent_at)) / 60 END), 0)::float AS avg_drill,
         COALESCE(AVG(CASE WHEN a.is_drill = FALSE OR a.is_drill IS NULL THEN EXTRACT(EPOCH FROM (c.checked_in_at - a.sent_at)) / 60 END), 0)::float AS avg_real
       FROM checkins c
       JOIN alerts a ON c.alert_id = a.alert_id
       WHERE ${alertIntervalClause}`
    );
    const avgResponseTime = Math.round((avgTimeRes.rows[0]?.avg_overall || 0) * 10) / 10;
    const avgDrillResponseTime = Math.round((avgTimeRes.rows[0]?.avg_drill || 0) * 10) / 10;
    const avgRealResponseTime = Math.round((avgTimeRes.rows[0]?.avg_real || 0) * 10) / 10;

    const rateRes = await pool.query(
      `SELECT 
         COUNT(DISTINCT c.checkin_id)::int AS total_checkins,
         (SELECT COUNT(*)::int FROM users WHERE is_active = TRUE AND role IN ('student', 'faculty', 'staff')) AS active_users,
         (SELECT COUNT(*)::int FROM alerts WHERE ${alertIntervalClause}) AS alert_count
       FROM checkins c
       JOIN alerts a ON c.alert_id = a.alert_id
       WHERE ${alertIntervalClause}`
    );

    const totalCheckins = rateRes.rows[0]?.total_checkins || 0;
    const activeUsers = rateRes.rows[0]?.active_users || 0;
    const alertCount = rateRes.rows[0]?.alert_count || 0;

    const overallCompletionRate =
      alertCount > 0 && activeUsers > 0
        ? Math.min(100, Math.round((totalCheckins / (activeUsers * alertCount)) * 1000) / 10)
        : 0;

    const hazardsRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM hazards WHERE ${hazardIntervalClause}`
    );
    const totalHazards = hazardsRes.rows[0]?.count || 0;

    // 2. Check-in Response Times per Alert (Bar Chart with is_drill tag)
    const responseTimesRes = await pool.query(
      `SELECT 
         a.alert_id,
         a.title,
         COALESCE(a.is_drill, FALSE) AS is_drill,
         TO_CHAR(a.sent_at, 'Mon DD') AS sent_date,
         ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (c.checked_in_at - a.sent_at)) / 60), 0)::numeric, 1)::float AS avg_minutes,
         COUNT(c.checkin_id)::int AS total_checkins
       FROM alerts a
       LEFT JOIN checkins c ON a.alert_id = c.alert_id
       WHERE ${alertIntervalClause}
       GROUP BY a.alert_id, a.title, a.is_drill, a.sent_at
       ORDER BY a.sent_at DESC
       LIMIT 10`
    );

    // 3. Status Breakdown (Pie/Donut Chart)
    const statusRes = await pool.query(
      `SELECT 
         COALESCE(c.status, 'safe') AS status,
         COUNT(*)::int AS count
       FROM checkins c
       JOIN alerts a ON c.alert_id = a.alert_id
       WHERE ${alertIntervalClause}
       GROUP BY COALESCE(c.status, 'safe')`
    );

    const statusCounts: Record<string, number> = { safe: 0, need_help: 0, injured: 0 };
    for (const row of statusRes.rows) {
      statusCounts[row.status] = row.count;
    }

    const statusBreakdown = [
      { status: 'safe' as const, count: statusCounts.safe },
      { status: 'need_help' as const, count: statusCounts.need_help },
      { status: 'injured' as const, count: statusCounts.injured },
    ];

    // 4. Per-Role Check-in Rates (Horizontal Bar Chart)
    const roleRatesRes = await pool.query(
      `SELECT 
         u.role,
         COUNT(DISTINCT u.user_id)::int AS total_users,
         COUNT(DISTINCT c.user_id)::int AS checked_in_users,
         CASE WHEN COUNT(DISTINCT u.user_id) > 0 
           THEN ROUND((COUNT(DISTINCT c.user_id)::numeric / COUNT(DISTINCT u.user_id)::numeric) * 100, 1)::float 
           ELSE 0 END AS rate
       FROM users u
       LEFT JOIN checkins c ON u.user_id = c.user_id
       WHERE u.role IN ('student', 'faculty', 'staff') AND u.is_active = TRUE
       GROUP BY u.role`
    );

    // 5. Alert History Over Time (Line Chart)
    const historyRes = await pool.query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('day', sent_at), 'Mon DD') AS date_label,
         COUNT(*)::int AS total_alerts,
         COUNT(CASE WHEN is_drill = TRUE THEN 1 END)::int AS drill_alerts,
         COUNT(CASE WHEN is_drill = FALSE OR is_drill IS NULL THEN 1 END)::int AS real_alerts
       FROM alerts
       WHERE ${alertIntervalClause}
       GROUP BY DATE_TRUNC('day', sent_at)
       ORDER BY DATE_TRUNC('day', sent_at) ASC`
    );

    // 6. Hazard Frequency by Type & Severity (Heatmap Matrix)
    const hazardsFreqRes = await pool.query(
      `SELECT 
         type,
         severity,
         COUNT(*)::int AS count
       FROM hazards
       WHERE ${hazardIntervalClause}
       GROUP BY type, severity
       ORDER BY type ASC, severity ASC`
    );

    return {
      kpis: {
        total_alerts: totalAlerts,
        drill_alerts_count: drillAlertsCount,
        real_alerts_count: realAlertsCount,
        avg_response_time_minutes: avgResponseTime,
        avg_drill_response_time_minutes: avgDrillResponseTime,
        avg_real_response_time_minutes: avgRealResponseTime,
        overall_completion_rate: overallCompletionRate,
        total_hazards: totalHazards,
      },
      response_times: responseTimesRes.rows.reverse(), // chronological order
      status_breakdown: statusBreakdown,
      role_rates: roleRatesRes.rows,
      alert_history: historyRes.rows,
      hazard_frequency: hazardsFreqRes.rows,
    };
  }
}
