import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';

type NfcStatus = {
  supported: boolean | null;
  enabled: boolean | null;
  canScan: boolean;
  openSettings: () => Promise<void>;
};

export function useNfcStatus(): NfcStatus {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setSupported(false);
      setEnabled(false);
      return;
    }

    try {
      const isSupported = await NfcManager.isSupported();
      setSupported(isSupported);

      if (!isSupported) {
        setEnabled(false);
        return;
      }

      await NfcManager.start();
      setEnabled(await NfcManager.isEnabled());
    } catch {
      setSupported(false);
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (Platform.OS === 'android') {
      NfcManager.setEventListener(NfcEvents.StateChanged, (event: { state: string }) => {
        if (event.state === 'on') {
          setEnabled(true);
        } else if (event.state === 'off') {
          setEnabled(false);
        }
      });
    }

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refresh();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.remove();
      if (Platform.OS === 'android') {
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
      }
    };
  }, [refresh]);

  const openSettings = useCallback(async () => {
    if (Platform.OS === 'android') {
      await NfcManager.goToNfcSetting();
    }
  }, []);

  const canScan = supported === true && enabled === true;

  return { supported, enabled, canScan, openSettings };
}
