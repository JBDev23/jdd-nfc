import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animated-background';
import { ExchangeConfigPanel } from '@/components/exchange/exchange-config-panel';
import { ExchangeConfirmPanel } from '@/components/exchange/exchange-confirm-panel';
import { ExchangeScreenHeader } from '@/components/exchange/exchange-screen-header';
import { ScanResultModal } from '@/components/scan-result-modal';
import { ScanningAnimation } from '@/components/scanning-animation';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useExchangeFlow } from '@/hooks/use-exchange-flow';

function NfcScanPanel({
  active,
  accentColor,
}: {
  active: boolean;
  accentColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ScanningAnimation active={active} variant="hero" accentColor={accentColor} />
    </View>
  );
}

export default function ExchangeScreen() {
  const flow = useExchangeFlow();
  const showNfcBackground = flow.phase === 'scan' || flow.phase === 'write';

  return (
    <ThemedView style={{ flex: 1 }}>
      {showNfcBackground && (
        <AnimatedBackground active={flow.isScanningActive} />
      )}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: Spacing.four,
          }}
        >
          <ExchangeScreenHeader
            phase={flow.phase}
            badge={flow.badge}
            config={flow.config}
            writeCompleted={flow.writeCompleted}
            showKeepNearHint={flow.showKeepNearHint}
            onOpenConfig={flow.handleOpenConfig}
            onBack={flow.handleBack}
          />

          {flow.phase === 'config' && (
            <ExchangeConfigPanel
              draft={flow.draft}
              onChange={flow.setDraft}
              onConfirm={flow.handleConfirmConfig}
            />
          )}

          {(flow.phase === 'scan' || flow.phase === 'write') && (
            <NfcScanPanel
              active={flow.isScanningActive}
              accentColor={flow.nfcScreenAccent}
            />
          )}

          {flow.phase === 'confirm' && flow.config && flow.braceletData && (
            <ExchangeConfirmPanel
              config={flow.config}
              braceletData={flow.braceletData}
              amount={flow.amount}
              onChangeAmount={flow.setAmount}
              onConfirm={flow.handleConfirmAmount}
              onUseAll={() => flow.setAmount(flow.braceletData![flow.config!.from])}
            />
          )}
        </View>
      </SafeAreaView>

      {flow.visibleModal && (
        <ScanResultModal
          visible
          type={flow.visibleModal.type}
          message={flow.visibleModal.message}
          durationMs={flow.visibleModalDuration}
        />
      )}
    </ThemedView>
  );
}
