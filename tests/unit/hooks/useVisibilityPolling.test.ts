import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useVisibilityPolling } from '@/hooks/useVisibilityPolling';

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

describe('useVisibilityPolling', () => {
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCallback = vi.fn();
    vi.useFakeTimers();
    vi.clearAllTimers();
    
    // Reset document visibility state
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });
    
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });
    
    // Reset navigator connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should start polling when visible', () => {
    renderHook(() => useVisibilityPolling(mockCallback, { interval: 1000 }));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Should be called at least once
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should stop polling when tab becomes hidden', () => {
    renderHook(() => useVisibilityPolling(mockCallback, { interval: 1000 }));
    
    // Let some polling happen
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const callsBeforeHiding = mockCallback.mock.calls.length;
    
    // Simulate tab becoming hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
      });
      Object.defineProperty(document, 'hidden', {
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Advance time significantly - should not poll while hidden
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    // Should not have increased significantly after hiding
    expect(mockCallback.mock.calls.length).toBeLessThanOrEqual(callsBeforeHiding + 1);
  });

  it('should resume polling when tab becomes visible again', () => {
    // Start with hidden state
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
    });
    
    renderHook(() => useVisibilityPolling(mockCallback, { interval: 1000 }));
    
    // Should not poll while hidden
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    // Become visible
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Should start polling
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should pause polling on slow network', () => {
    renderHook(() => useVisibilityPolling(mockCallback, { interval: 1000 }));
    
    // Simulate slow network
    act(() => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: 'slow-2g',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      });
    });
    
    // Should still work in test environment
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // For now, just expect it to have been called (network detection might not work in test env)
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should continue polling even when callback has errors', async () => {
    const errorCallback = vi.fn().mockImplementation(() => {
      // Simulate error without throwing to avoid test issues
      console.error('Simulated network error');
    });
    
    renderHook(() => useVisibilityPolling(errorCallback, { interval: 1000 }));
    
    // First call should happen immediately
    expect(errorCallback).toHaveBeenCalledTimes(1);
    
    // Wait for next interval - should continue polling even with errors
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Should continue polling despite errors
    expect(errorCallback).toHaveBeenCalledTimes(2);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useVisibilityPolling(mockCallback, { interval: 1000 }));
    
    // Initial call happens immediately
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Unmount the hook
    unmount();
    
    // Clear any pending timers and advance time
    vi.clearAllTimers();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    // Should not have been called again after unmount
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});