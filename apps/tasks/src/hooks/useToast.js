import { useState, useCallback, useRef } from 'react';

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
  const idRef = useRef(0);

  /** @type {import('react').Callback} */
  const showToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}
