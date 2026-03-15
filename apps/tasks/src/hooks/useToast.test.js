import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast with default type', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Hello world');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Hello world',
      type: 'info'
    });
  });

  it('adds a toast with custom type', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Error occurred', 'error');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Error occurred',
      type: 'error'
    });
  });

  it('adds success toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Saved!', 'success');
    });

    expect(result.current.toasts[0].type).toBe('success');
  });

  it('removes toast after 3 seconds', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Temp message');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('does not remove toast before 3 seconds', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Temp message');
    });

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('generates unique ids for toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('First');
      result.current.showToast('Second');
      result.current.showToast('Third');
    });

    const ids = result.current.toasts.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('adds multiple toasts at once', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('One', 'info');
      result.current.showToast('Two', 'success');
      result.current.showToast('Three', 'error');
    });

    expect(result.current.toasts).toHaveLength(3);
  });
});
