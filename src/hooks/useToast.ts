import { useCallback, useEffect, useState } from 'react';

const TOAST_DURATION_MS = 2800;

export function useToast() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const showToast = useCallback((text: string) => setMessage(text), []);

  return { toastMessage: message, showToast };
}
