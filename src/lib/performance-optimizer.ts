import { metricsCollector } from './metrics-collector';

// Performance budget thresholds
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  FCP: 1500, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift (score)
  TTFB: 600, // Time to First Byte (ms)
  
  // Bundle sizes (KB)
  MAIN_BUNDLE: 250,
  VENDOR_BUNDLE: 500,
  TOTAL_JS: 1000,
  TOTAL_CSS: 100,
  
  // API performance
  API_RESPONSE: 500, // ms
  DATABASE_QUERY: 100, // ms
  
  // Memory usage
  HEAP_SIZE: 512, // MB
  
  // Network
  CACHE_HIT_RATE: 0.8, // 80%
};

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private observers: Map<string, PerformanceObserver> = new Map();
  private budgetViolations: Array<{
    metric: string;
    value: number;
    threshold: number;
    timestamp: Date;
  }> = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  initialize(): void {
    if (typeof window === 'undefined') return;

    this.setupWebVitalsMonitoring();
    this.setupResourceMonitoring();
    this.setupNavigationMonitoring();
    this.setupMemoryMonitoring();
    this.setupLongTaskMonitoring();
  }

  private setupWebVitalsMonitoring(): void {
    // First Contentful Paint
    this.createObserver('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.checkBudget('FCP', entry.startTime, PERFORMANCE_BUDGETS.FCP);
          metricsCollector.trackPageLoadTime('FCP', entry.startTime);
        }
      });
    });

    // Largest Contentful Paint
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.checkBudget('LCP', lastEntry.startTime, PERFORMANCE_BUDGETS.LCP);
      metricsCollector.trackPageLoadTime('LCP', lastEntry.startTime);
    });

    // First Input Delay
    this.createObserver('first-input', (entries) => {
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        this.checkBudget('FID', fid, PERFORMANCE_BUDGETS.FID);
        metricsCollector.trackPageLoadTime('FID', fid);
      });
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    this.createObserver('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.checkBudget('CLS', clsValue, PERFORMANCE_BUDGETS.CLS);
      metricsCollector.trackPageLoadTime('CLS', clsValue);
    });
  }

  private setupResourceMonitoring(): void {
    this.createObserver('resource', (entries) => {
      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        
        // Track slow resources
        if (resource.duration > 1000) {
          metricsCollector.trackApiPerformance(
            resource.name,
            resource.duration,
            200
          );
        }

        // Check for render-blocking resources
        if (this.isRenderBlocking(resource)) {
          console.warn('Render-blocking resource detected:', resource.name);
          this.optimizeResource(resource);
        }
      });
    });
  }

  private setupNavigationMonitoring(): void {
    this.createObserver('navigation', (entries) => {
      entries.forEach((entry) => {
        const nav = entry as PerformanceNavigationTiming;
        
        // Time to First Byte
        const ttfb = nav.responseStart - nav.requestStart;
        this.checkBudget('TTFB', ttfb, PERFORMANCE_BUDGETS.TTFB);
        
        // DOM Content Loaded
        const dcl = nav.domContentLoadedEventEnd - nav.fetchStart;
        metricsCollector.trackPageLoadTime('DCL', dcl);
        
        // Full page load
        const load = nav.loadEventEnd - nav.fetchStart;
        metricsCollector.trackPageLoadTime('Load', load);
      });
    });
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const heapSizeMB = memory.usedJSHeapSize / 1024 / 1024;
        
        this.checkBudget('HEAP_SIZE', heapSizeMB, PERFORMANCE_BUDGETS.HEAP_SIZE);
        metricsCollector.trackMemoryUsage('browser', heapSizeMB);
        
        // Suggest garbage collection if memory usage is high
        if (heapSizeMB > PERFORMANCE_BUDGETS.HEAP_SIZE * 0.8) {
          this.suggestMemoryOptimization();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private setupLongTaskMonitoring(): void {
    this.createObserver('longtask', (entries) => {
      entries.forEach((entry) => {
        console.warn('Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
        });
        
        metricsCollector.trackApiPerformance(
          'long-task',
          entry.duration,
          200
        );
        
        // Suggest code splitting for long tasks
        if (entry.duration > 100) {
          this.suggestCodeSplitting();
        }
      });
    });
  }

  private createObserver(entryType: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [entryType], buffered: true });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`Failed to create observer for ${entryType}:`, error);
    }
  }

  private checkBudget(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      const violation = {
        metric,
        value,
        threshold,
        timestamp: new Date(),
      };
      
      this.budgetViolations.push(violation);
      
      console.warn(`Performance budget violation: ${metric}`, violation);
      
      // Send alert for critical violations
      if (this.isCriticalViolation(metric, value, threshold)) {
        this.sendPerformanceAlert(violation);
      }
    }
  }

  private isCriticalViolation(metric: string, value: number, threshold: number): boolean {
    const ratio = value / threshold;
    return ratio > 1.5; // 50% over budget is critical
  }

  private async sendPerformanceAlert(violation: any): Promise<void> {
    try {
      await fetch('/api/alerts/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation),
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  private isRenderBlocking(resource: PerformanceResourceTiming): boolean {
    const url = new URL(resource.name);
    const isCSS = url.pathname.endsWith('.css');
    const isJS = url.pathname.endsWith('.js') && !url.searchParams.has('async');
    
    return (isCSS || isJS) && (resource as any).renderBlockingStatus === 'blocking';
  }

  private optimizeResource(resource: PerformanceResourceTiming): void {
    const suggestions = [];
    
    if (resource.name.includes('.css')) {
      suggestions.push('Consider inlining critical CSS');
      suggestions.push('Use media queries to defer non-critical CSS');
    }
    
    if (resource.name.includes('.js')) {
      suggestions.push('Add async or defer attributes');
      suggestions.push('Consider code splitting');
    }
    
    if (resource.duration > 2000) {
      suggestions.push('Optimize resource size or use CDN');
    }
    
    console.log(`Optimization suggestions for ${resource.name}:`, suggestions);
  }

  private suggestMemoryOptimization(): void {
    const suggestions = [
      'Remove unused event listeners',
      'Clear large data structures when not needed',
      'Use WeakMap/WeakSet for temporary references',
      'Implement virtual scrolling for large lists',
      'Optimize image sizes and formats',
    ];
    
    console.log('Memory optimization suggestions:', suggestions);
  }

  private suggestCodeSplitting(): void {
    const suggestions = [
      'Split large components into smaller chunks',
      'Use dynamic imports for heavy libraries',
      'Implement route-based code splitting',
      'Defer non-critical JavaScript execution',
    ];
    
    console.log('Code splitting suggestions:', suggestions);
  }

  // Public methods for manual optimization
  preloadCriticalResources(resources: string[]): void {
    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }

  prefetchNextPageResources(urls: string[]): void {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  optimizeImages(): void {
    const images = document.querySelectorAll('img[data-optimize]');
    
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      
      // Add loading="lazy" if not present
      if (!imageElement.loading) {
        imageElement.loading = 'lazy';
      }
      
      // Add decoding="async" for better performance
      if (!imageElement.decoding) {
        imageElement.decoding = 'async';
      }
    });
  }

  getBudgetViolations(): typeof this.budgetViolations {
    return [...this.budgetViolations];
  }

  getPerformanceReport(): {
    budgetViolations: number;
    criticalViolations: number;
    suggestions: string[];
  } {
    const criticalViolations = this.budgetViolations.filter(v => 
      this.isCriticalViolation(v.metric, v.value, v.threshold)
    );
    
    const suggestions = this.generateOptimizationSuggestions();
    
    return {
      budgetViolations: this.budgetViolations.length,
      criticalViolations: criticalViolations.length,
      suggestions,
    };
  }

  private generateOptimizationSuggestions(): string[] {
    const suggestions = [];
    
    if (this.budgetViolations.some(v => v.metric === 'LCP')) {
      suggestions.push('Optimize Largest Contentful Paint by reducing image sizes');
    }
    
    if (this.budgetViolations.some(v => v.metric === 'FID')) {
      suggestions.push('Reduce JavaScript execution time during page load');
    }
    
    if (this.budgetViolations.some(v => v.metric === 'CLS')) {
      suggestions.push('Reserve space for dynamic content to prevent layout shifts');
    }
    
    return suggestions;
  }

  destroy(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  performanceOptimizer.initialize();
}