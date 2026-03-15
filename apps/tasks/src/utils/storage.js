const VIEW_STORAGE_KEY = 'tasks-app-view';

/**
 * Get stored view preference from localStorage
 * @returns {'backlog' | 'board'}
 */
export function getStoredView() {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === 'backlog' || stored === 'board') return stored;
  } catch {}
  return 'board';
}

/**
 * Save view preference to localStorage
 * @param {'backlog' | 'board'} view
 */
export function setStoredView(view) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // Ignore storage errors
  }
}
