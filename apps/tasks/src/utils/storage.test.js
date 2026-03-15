import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getStoredView, setStoredView } from '../utils/storage.js';

const VIEW_STORAGE_KEY = 'tasks-app-view';

describe('storage', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getStoredView', () => {
    it('returns "board" when nothing stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getStoredView()).toBe('board');
    });

    it('returns "board" for invalid stored value', () => {
      localStorageMock.getItem.mockReturnValue('invalid');
      expect(getStoredView()).toBe('board');
    });

    it('returns "backlog" when stored', () => {
      localStorageMock.getItem.mockReturnValue('backlog');
      expect(getStoredView()).toBe('backlog');
    });

    it('returns stored "board" value', () => {
      localStorageMock.getItem.mockReturnValue('board');
      expect(getStoredView()).toBe('board');
    });

    it('handles localStorage error gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(getStoredView()).toBe('board');
    });
  });

  describe('setStoredView', () => {
    it('stores "backlog" view', () => {
      setStoredView('backlog');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        VIEW_STORAGE_KEY,
        'backlog'
      );
    });

    it('stores "board" view', () => {
      setStoredView('board');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        VIEW_STORAGE_KEY,
        'board'
      );
    });

    it('handles localStorage error gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => setStoredView('board')).not.toThrow();
    });
  });
});