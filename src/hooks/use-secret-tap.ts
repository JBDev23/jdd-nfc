import { useCallback, useRef } from 'react';

const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 2000;

export function useSecretTap(onSecret: () => void) {
  const tapCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    tapCountRef.current += 1;

    if (tapCountRef.current >= SECRET_TAP_COUNT) {
      tapCountRef.current = 0;
      onSecret();
      return;
    }

    timerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, SECRET_TAP_WINDOW_MS);
  }, [onSecret]);

  return handlePress;
}
