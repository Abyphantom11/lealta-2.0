import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MetricEventSchema = z.object({
  id: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  type: z.enum(['business', 'technical', 'user-experience']),
  source: z.string(),
  tags: z.record(z.string()),
  value: z.number(),
  unit: z.string(),
  userId: z.string().optional(),
  businessId: z.string().optional(),
  sessionId: z.string().optional(),
});

const MetricsRequestSchema = z.object({
  metrics: z.array(MetricEventSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics } = MetricsRequestSchema.parse(body);

    // Process metrics based on type
    const processedMetrics = await Promise.all(
      metrics.map(async (metric) => {
        // Store in database or send to external service
        await processMetric(metric);
        return metric;
      })
    );

    // Send critical metrics to alerting system
    const criticalMetrics = metrics.filter(isCriticalMetric);
    if (criticalMetrics.length > 0) {
      await sendCriticalAlerts(criticalMetrics);
    }

    return NextResponse.json({
      success: true,
      processed: processedMetrics.length,
      critical: criticalMetrics.length,
    });
  } catch (error) {
    console.error('Metrics processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}

async function processMetric(metric: z.infer<typeof MetricEventSchema>) {
  // Here you would typically:
  // 1. Store in database for historical analysis
  // 2. Send to monitoring service (DataDog, New Relic, etc.)
  // 3. Update real-time dashboards
  // 4. Trigger alerts if thresholds are exceeded

  switch (metric.type) {
    case 'business':
      await processBusinessMetric(metric);
      break;
    case 'technical':
      await processTechnicalMetric(metric);
      break;
    case 'user-experience':
      await processUserExperienceMetric(metric);
      break;
  }

  // Log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[METRIC] ${metric.type}/${metric.source}:`, {
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
    });
  }
}

async function processBusinessMetric(metric: z.infer<typeof MetricEventSchema>) {
  // Business metrics processing
  switch (metric.source) {
    case 'user_engagement':
      // Track user engagement patterns
      break;
    case 'conversion':
      // Track conversion rates and revenue
      break;
    case 'business_kpi':
      // Update business KPI dashboards
      break;
  }
}

async function processTechnicalMetric(metric: z.infer<typeof MetricEventSchema>) {
  // Technical metrics processing
  switch (metric.source) {
    case 'api_performance':
      // Monitor API response times
      if (metric.value > 5000) { // > 5 seconds
        await sendAlert('API_SLOW_RESPONSE', metric);
      }
      break;
    case 'cache_performance':
      // Monitor cache hit rates
      if (metric.value < 0.7) { // < 70% hit rate
        await sendAlert('CACHE_LOW_HIT_RATE', metric);
      }
      break;
    case 'database_performance':
      // Monitor database query performance
      if (metric.value > 1000) { // > 1 second
        await sendAlert('DATABASE_SLOW_QUERY', metric);
      }
      break;
    case 'memory_usage':
      // Monitor memory usage
      if (metric.value > 512) { // > 512MB
        await sendAlert('HIGH_MEMORY_USAGE', metric);
      }
      break;
  }
}

async function processUserExperienceMetric(metric: z.infer<typeof MetricEventSchema>) {
  // User experience metrics processing
  switch (metric.source) {
    case 'web_vitals':
      await processWebVital(metric);
      break;
    case 'error_boundary':
      // Always alert on error boundaries
      await sendAlert('ERROR_BOUNDARY_TRIGGERED', metric);
      break;
    case 'page_performance':
      // Monitor page load times
      if (metric.value > 3000) { // > 3 seconds
        await sendAlert('SLOW_PAGE_LOAD', metric);
      }
      break;
  }
}

async function processWebVital(metric: z.infer<typeof MetricEventSchema>) {
  const vital = metric.tags.vital;
  let threshold = 0;
  let alertType = '';

  switch (vital) {
    case 'FCP':
      threshold = 1800; // 1.8 seconds
      alertType = 'SLOW_FCP';
      break;
    case 'LCP':
      threshold = 2500; // 2.5 seconds
      alertType = 'SLOW_LCP';
      break;
    case 'FID':
      threshold = 100; // 100ms
      alertType = 'HIGH_FID';
      break;
    case 'CLS':
      threshold = 0.1; // 0.1 score
      alertType = 'HIGH_CLS';
      break;
  }

  if (metric.value > threshold) {
    await sendAlert(alertType, metric);
  }
}

function isCriticalMetric(metric: z.infer<typeof MetricEventSchema>): boolean {
  return (
    metric.source === 'error_boundary' ||
    (metric.source === 'api_performance' && metric.value > 10000) ||
    (metric.source === 'web_vitals' && metric.tags.vital === 'CLS' && metric.value > 0.25) ||
    (metric.source === 'database_performance' && metric.value > 5000)
  );
}

async function sendCriticalAlerts(metrics: z.infer<typeof MetricEventSchema>[]) {
  // Send to Slack, email, or other alerting systems
  for (const metric of metrics) {
    await sendAlert('CRITICAL_METRIC', metric);
  }
}

async function sendAlert(alertType: string, metric: z.infer<typeof MetricEventSchema>) {
  // Implementation would depend on your alerting system
  // Examples: Slack webhook, email, PagerDuty, etc.
  
  const alertData = {
    type: alertType,
    metric: {
      source: metric.source,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
      timestamp: metric.timestamp,
    },
    severity: isCriticalMetric(metric) ? 'critical' : 'warning',
  };

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[ALERT] ${alertType}:`, alertData);
  }

  // Example: Send to Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alertType}: ${metric.source} = ${metric.value} ${metric.unit}`,
          attachments: [{
            color: alertData.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Source', value: metric.source, short: true },
              { title: 'Value', value: `${metric.value} ${metric.unit}`, short: true },
              { title: 'Tags', value: JSON.stringify(metric.tags), short: false },
            ],
          }],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  // Return metrics dashboard data
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '1h';

  // This would typically query your metrics database
  // For now, return mock data structure
  return NextResponse.json({
    timeRange,
    metrics: {
      business: {
        userEngagement: 1250,
        conversions: 45,
        revenue: 12500,
      },
      technical: {
        avgApiResponseTime: 245,
        cacheHitRate: 0.87,
        errorRate: 0.002,
      },
      userExperience: {
        avgPageLoadTime: 1850,
        fcp: 1200,
        lcp: 2100,
        fid: 85,
        cls: 0.08,
      },
    },
    alerts: {
      active: 2,
      resolved: 15,
      critical: 0,
    },
  });
}