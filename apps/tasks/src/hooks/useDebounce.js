import { useEffect, useState } from 'react';

/**
 * Debounce a value with a delay
 * @param {T} value
 * @param {number} delay
 * @returns {T}
 * @template T
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
