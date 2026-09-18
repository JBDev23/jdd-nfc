import { useEffect } from 'react';
import { Platform } from 'react-native';
import NfcManager from 'react-native-nfc-manager';

/**
 * Keeps Android foreground NFC dispatch active while the app is open so the
 * system "NFC tag detected" UI does not steal scans before the user taps scan.
 */
export function useNfcForeground() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let cancelled = false;

    async function enableForegroundCapture() {
      const supported = await NfcManager.isSupported();
      if (!supported || cancelled) {
        return;
      }

      await NfcManager.start();
      await NfcManager.registerTagEvent();
    }

    enableForegroundCapture().catch(() => {
      // NFC unavailable on this device; nothing to do.
    });

    return () => {
      cancelled = true;
      NfcManager.unregisterTagEvent().catch(() => {
        // Ignore cleanup errors.
      });
    };
  }, []);
}
