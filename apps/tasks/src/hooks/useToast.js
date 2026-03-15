import { useState, useCallback } from 'react';

/**
 * Toast notification types
 * @typedef {'info' | 'success' | 'error'} ToastType
 */

/**
 * @typedef {Object} Toast
 * @property {number} id
 * @property {string} message
 * @property {ToastType} type
 */

/**
 * Hook for managing toast notifications
 * @returns {{toasts: Toast[], showToast: (message: string, type?: ToastType) => void}}
 */
export function useToast() {
  const [toasts, setToasts] = useState(/** @type {Toast[]} */ ([]));

  /** @type {import('react').Callback} */
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}
