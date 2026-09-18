import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import NfcManager from 'react-native-nfc-manager';

import { useNfcStatusContext } from '@/hooks/nfc-status-context';
import { NfcBraceletError, getNfcBraceletErrorMessage } from '@/services/nfc-bracelet';
import { playScanSound } from '@/services/scan-sounds';

type ScanModalState = {
  type: 'success' | 'error' | 'not_active';
  message: string;
};

type UseNfcScanLoopOptions<TResult> = {
  scan: () => Promise<TResult>;
  getSuccessMessage: (result: TResult) => string;
  enabled?: boolean;
  resultDurationMs?: number;
  /** Restarts the scan loop when this value changes (e.g. selected resource). */
  restartKey?: unknown;
};

function delay(ms: number, isCancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const tick = () => {
      if (isCancelled() || Date.now() - startedAt >= ms) {
        resolve();
        return;
      }

      setTimeout(tick, Math.min(100, ms - (Date.now() - startedAt)));
    };

    setTimeout(tick, Math.min(100, ms));
  });
}

export function useNfcScanLoop<TResult>({
  scan,
  getSuccessMessage,
  enabled = true,
  resultDurationMs = 3500,
  restartKey,
}: UseNfcScanLoopOptions<TResult>) {
  const { canScan } = useNfcStatusContext();
  const scanEnabled = enabled && canScan;

  const [scanning, setScanning] = useState(false);
  const [modal, setModal] = useState<ScanModalState | null>(null);
  const [lastResult, setLastResult] = useState<TResult | null>(null);
  const [showKeepNearHint, setShowKeepNearHint] = useState(false);

  const scanRef = useRef(scan);
  const getSuccessMessageRef = useRef(getSuccessMessage);
  scanRef.current = scan;
  getSuccessMessageRef.current = getSuccessMessage;

  useFocusEffect(
    useCallback(() => {
      if (!scanEnabled) {
        return;
      }

      let cancelled = false;
      const isCancelled = () => cancelled;

      async function runLoop() {
        while (!cancelled) {
          setScanning(true);
          setModal(null);

          try {
            const result = await scanRef.current();
            if (cancelled) return;

            setLastResult(result);
            setScanning(false);
            setShowKeepNearHint(false);
            playScanSound('success');
            setModal({ type: 'success', message: getSuccessMessageRef.current(result) });
          } catch (error) {
            if (cancelled) return;

            setScanning(false);
            if (error instanceof NfcBraceletError && error.code === 'scan_cancelled') {
              await delay(350, isCancelled);
              continue;
            }

            setShowKeepNearHint(true);

            if (error instanceof NfcBraceletError && error.code === 'not_active') {
              await delay(90, isCancelled);
              if (cancelled) return;
              playScanSound('error');
              setModal({ type: 'not_active', message: getNfcBraceletErrorMessage(error) });
            } else {
              await delay(90, isCancelled);
              if (cancelled) return;
              playScanSound('error');
              setModal({ type: 'error', message: getNfcBraceletErrorMessage(error) });
            }
          }

          await delay(resultDurationMs, isCancelled);
          if (cancelled) return;

          setModal(null);
          await delay(350, isCancelled);
        }
      }

      void runLoop();

      return () => {
        cancelled = true;
        setScanning(false);
        setModal(null);
        setShowKeepNearHint(false);

        if (Platform.OS !== 'web') {
          NfcManager.cancelTechnologyRequest().catch(() => {});
        }
      };
    }, [scanEnabled, resultDurationMs, restartKey]),
  );

  return {
    scanning,
    modal,
    lastResult,
    resultDurationMs,
    showKeepNearHint,
  };
}
