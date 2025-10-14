export interface MetricEvent {
  id: string;
  timestamp: Date;
  type: 'business' | 'technical' | 'user-experience';
  source: string;
  tags: Record<string, string>;
  value: number;
  unit: string;
  userId?: string;
  businessId?: string;
  sessionId?: string;
}

export interface BusinessMetric {
  type: 'user_engagement' | 'conversion' | 'retention' | 'revenue';
  value: number;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: MetricEvent[] = [];
  private readonly maxMetrics = 1000;
  private readonly flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startFlushTimer();
    
    // Collect Core Web Vitals automatically
    if (typeof window !== 'undefined') {
      this.collectWebVitals();
    }
  }

  // Business Metrics
  trackUserEngagement(userId: string, action: string): void {
    this.addMetric({
      type: 'business',
      source: 'user_engagement',
      value: 1,
      unit: 'count',
      tags: { action, userId },
      userId,
    });
  }

  trackBusinessMetrics(businessId: string, metric: BusinessMetric): void {
    this.addMetric({
      type: 'business',
      source: 'business_kpi',
      value: metric.value,
      unit: metric.type,
      tags: { metric_type: metric.type },
      businessId,
    });
  }

  trackConversion(businessId: string, userId: string, conversionType: string, value: number): void {
    this.addMetric({
      type: 'business',
      source: 'conversion',
      value,
      unit: 'currency',
      tags: { conversion_type: conversionType },
      businessId,
      userId,
    });
  }

  // Technical Metrics
  trackApiPerformance(endpoint: string, duration: number, status: number): void {
    this.addMetric({
      type: 'technical',
      source: 'api_performance',
      value: duration,
      unit: 'milliseconds',
      tags: { endpoint, status: status.toString() },
    });
  }

  trackCacheHitRate(cacheType: string, hitRate: number): void {
    this.addMetric({
      type: 'technical',
      source: 'cache_performance',
      value: hitRate,
      unit: 'percentage',
      tags: { cache_type: cacheType },
    });
  }

  trackDatabaseQuery(query: string, duration: number, success: boolean): void {
    this.addMetric({
      type: 'technical',
      source: 'database_performance',
      value: duration,
      unit: 'milliseconds',
      tags: { query_type: query, success: success.toString() },
    });
  }

  trackMemoryUsage(component: string, memoryMB: number): void {
    this.addMetric({
      type: 'technical',
      source: 'memory_usage',
      value: memoryMB,
      unit: 'megabytes',
      tags: { component },
    });
  }

  // User Experience Metrics
  trackPageLoadTime(page: string, loadTime: number): void {
    this.addMetric({
      type: 'user-experience',
      source: 'page_performance',
      value: loadTime,
      unit: 'milliseconds',
      tags: { page },
    });
  }

  trackErrorBoundary(component: string, error: Error): void {
    this.addMetric({
      type: 'user-experience',
      source: 'error_boundary',
      value: 1,
      unit: 'count',
      tags: { 
        component, 
        error_type: error.name,
        error_message: error.message.substring(0, 100),
      },
    });
  }

  trackUserInteraction(action: string, element: string, duration?: number): void {
    this.addMetric({
      type: 'user-experience',
      source: 'user_interaction',
      value: duration || 1,
      unit: duration ? 'milliseconds' : 'count',
      tags: { action, element },
    });
  }

  // Core Web Vitals Collection
  private collectWebVitals(): void {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.trackWebVital('FCP', entry.startTime);
        }
      });
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackWebVital('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.trackWebVital('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.trackWebVital('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private trackWebVital(name: string, value: number): void {
    this.addMetric({
      type: 'user-experience',
      source: 'web_vitals',
      value,
      unit: name === 'CLS' ? 'score' : 'milliseconds',
      tags: { vital: name },
    });
  }

  private addMetric(metric: Omit<MetricEvent, 'id' | 'timestamp'>): void {
    const metricEvent: MetricEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...metric,
    };

    this.metrics.push(metricEvent);

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Send critical metrics immediately
    if (this.isCriticalMetric(metricEvent)) {
      this.sendMetric(metricEvent);
    }
  }

  private isCriticalMetric(metric: MetricEvent): boolean {
    return (
      metric.source === 'error_boundary' ||
      (metric.source === 'api_performance' && metric.value > 5000) ||
      (metric.source === 'web_vitals' && metric.tags.vital === 'CLS' && metric.value > 0.25)
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await this.sendMetrics(metricsToSend);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-add metrics to queue for retry
      this.metrics.unshift(...metricsToSend.slice(-100)); // Keep last 100
    }
  }

  private async sendMetric(metric: MetricEvent): Promise<void> {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: [metric] }),
      });
    } catch (error) {
      console.error('Failed to send critical metric:', error);
    }
  }

  private async sendMetrics(metrics: MetricEvent[]): Promise<void> {
    if (typeof window === 'undefined') return;

    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
    });
  }

  // Public methods for getting metrics
  getMetrics(filter?: Partial<MetricEvent>): MetricEvent[] {
    if (!filter) return [...this.metrics];

    return this.metrics.filter(metric => {
      return Object.entries(filter).every(([key, value]) => {
        return metric[key as keyof MetricEvent] === value;
      });
    });
  }

  getMetricsSummary(): {
    total: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    avgValue: number;
  } {
    const total = this.metrics.length;
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let totalValue = 0;

    this.metrics.forEach(metric => {
      byType[metric.type] = (byType[metric.type] || 0) + 1;
      bySource[metric.source] = (bySource[metric.source] || 0) + 1;
      totalValue += metric.value;
    });

    return {
      total,
      byType,
      bySource,
      avgValue: total > 0 ? totalValue / total : 0,
    };
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Send remaining metrics
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

// React Hook for easy usage
export function useMetrics() {
  return {
    trackUserEngagement: metricsCollector.trackUserEngagement.bind(metricsCollector),
    trackBusinessMetrics: metricsCollector.trackBusinessMetrics.bind(metricsCollector),
    trackApiPerformance: metricsCollector.trackApiPerformance.bind(metricsCollector),
    trackPageLoadTime: metricsCollector.trackPageLoadTime.bind(metricsCollector),
    trackErrorBoundary: metricsCollector.trackErrorBoundary.bind(metricsCollector),
    trackUserInteraction: metricsCollector.trackUserInteraction.bind(metricsCollector),
    getMetrics: metricsCollector.getMetrics.bind(metricsCollector),
    getMetricsSummary: metricsCollector.getMetricsSummary.bind(metricsCollector),
  };
}