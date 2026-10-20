import { useEffect, useRef } from 'react';

/** Agrupa una ráfaga de llamadas en una sola, cuando el usuario hace una pausa. */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delayMs: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const latestCallback = useRef(callback);
  latestCallback.current = callback;

  useEffect(() => () => clearTimeout(timer.current), []);

  return (...args: Args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latestCallback.current(...args), delayMs);
  };
}
