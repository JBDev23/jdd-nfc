import { createContext, useContext, type ReactNode } from 'react';

import { useNfcStatus } from '@/hooks/use-nfc-status';

type NfcStatusValue = ReturnType<typeof useNfcStatus>;

const NfcStatusContext = createContext<NfcStatusValue | null>(null);

export function NfcStatusProvider({ children }: { children: ReactNode }) {
  const status = useNfcStatus();

  return <NfcStatusContext.Provider value={status}>{children}</NfcStatusContext.Provider>;
}

export function useNfcStatusContext(): NfcStatusValue {
  const context = useContext(NfcStatusContext);
  if (!context) {
    throw new Error('useNfcStatusContext must be used within NfcStatusProvider');
  }
  return context;
}
