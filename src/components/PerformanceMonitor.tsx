'use client';

import { useEffect, useRef } from 'react';
import { metricsCollector } from '@/lib/metrics-collector';

interface PerformanceMonitorProps {
  pageName: string;
  children: React.ReactNode;
  trackInteractions?: boolean;
  trackResources?: boolean;
}

export function PerformanceMonitor({ 
  pageName, 
  children, 
  trackInteractions = true,
  trackResources = true 
}: PerformanceMonitorProps) {
  const startTimeRef = useRef<number>(Date.now());
  const interactionObserverRef = useRef<PerformanceObserver | null>(null);
  const resourceObserverRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    const startTime = startTimeRef.current;

    // Track page load time
    const handleLoad = () => {
      const loadTime = Date.now() - startTime;
      metricsCollector.trackPageLoadTime(pageName, loadTime);
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Track user interactions
    if (trackInteractions && 'PerformanceObserver' in window) {
      try {
        interactionObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.entryType === 'event') {
              metricsCollector.trackUserInteraction(
                entry.name,
                entry.target?.tagName || 'unknown',
                entry.duration
              );
            }
          });
        });

        interactionObserverRef.current.observe({ 
          entryTypes: ['event'],
          buffered: true 
        });
      } catch (error) {
        console.warn('Failed to observe user interactions:', error);
      }
    }

    // Track resource loading performance
    if (trackResources && 'PerformanceObserver' in window) {
      try {
        resourceObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              
              // Track slow resources
              if (resourceEntry.duration > 1000) { // > 1 second
                metricsCollector.trackApiPerformance(
                  resourceEntry.name,
                  resourceEntry.duration,
                  200 // Assume success if loaded
                );
              }
            }
          });
        });

        resourceObserverRef.current.observe({ 
          entryTypes: ['resource'],
          buffered: true 
        });
      } catch (error) {
        console.warn('Failed to observe resource loading:', error);
      }
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      
      if (interactionObserverRef.current) {
        interactionObserverRef.current.disconnect();
      }
      
      if (resourceObserverRef.current) {
        resourceObserverRef.current.disconnect();
      }
    };
  }, [pageName, trackInteractions, trackResources]);

  // Track component mount/unmount times
  useEffect(() => {
    const mountTime = Date.now();
    
    return () => {
      const unmountTime = Date.now();
      const componentLifetime = unmountTime - mountTime;
      
      // Track long-lived components
      if (componentLifetime > 30000) { // > 30 seconds
        metricsCollector.trackUserEngagement(
          'anonymous',
          `long_session_${pageName}_${componentLifetime}ms`
        );
      }
    };
  }, [pageName]);

  return <>{children}</>;
}

// Hook for manual performance tracking
export function usePerformanceTracking(componentName: string) {
  const startTimeRef = useRef<number | null>(null);

  const startTracking = (operationName: string) => {
    startTimeRef.current = performance.now();
    return operationName;
  };

  const endTracking = (operationName: string) => {
    if (startTimeRef.current !== null) {
      const duration = performance.now() - startTimeRef.current;
      
      metricsCollector.trackApiPerformance(
        `${componentName}/${operationName}`,
        duration,
        200
      );
      
      startTimeRef.current = null;
      return duration;
    }
    return 0;
  };

  const trackAsyncOperation = async <T,>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      metricsCollector.trackApiPerformance(
        `${componentName}/${operationName}`,
        duration,
        200
      );
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      metricsCollector.trackApiPerformance(
        `${componentName}/${operationName}`,
        duration,
        500
      );
      
      throw error;
    }
  };

  const trackUserAction = (action: string, element?: string) => {
    metricsCollector.trackUserInteraction(action, element || componentName);
  };

  return {
    startTracking,
    endTracking,
    trackAsyncOperation,
    trackUserAction,
  };
}

// Component for tracking specific UI interactions
export function InteractionTracker({ 
  children, 
  action, 
  element,
  onInteraction 
}: {
  children: React.ReactNode;
  action: string;
  element?: string;
  onInteraction?: () => void;
}) {
  const handleInteraction = () => {
    metricsCollector.trackUserInteraction(action, element || 'unknown');
    onInteraction?.();
  };

  return (
    <div 
      onClick={handleInteraction}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleInteraction();
        }
      }}
    >
      {children}
    </div>
  );
}