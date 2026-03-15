import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    // Should still be initial before delay
    expect(result.current).toBe('initial');

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'c', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Still 'a' because each change resets timer
    expect(result.current).toBe('a');

    // Now advance past the last delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('c');
  });

  it('clears timer on unmount', () => {
    const { result, unmount } = renderHook(() => useDebounce('value', 500));
    
    unmount();
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Should not throw and should maintain value
    expect(result.current).toBe('value');
  });
});
