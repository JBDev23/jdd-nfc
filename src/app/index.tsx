import { AnimatedBackground } from "@/components/animated-background";
import { NfcKeepNearBanner } from "@/components/nfc-keep-near-banner";
import {
  getNfcBadgeConfig,
  NfcStatusBadge,
} from "@/components/nfc-status-badge";
import { ScanResultModal } from "@/components/scan-result-modal";
import { ScanningAnimation } from "@/components/scanning-animation";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useNfcStatusContext } from "@/hooks/nfc-status-context";
import { useNfcScanLoop } from "@/hooks/use-nfc-scan-loop";
import { activateBracelet } from "@/services/nfc-bracelet";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivateScreen() {
  const { supported, enabled, canScan } = useNfcStatusContext();
  const scan = useCallback(() => activateBracelet(), []);
  const getSuccessMessage = useCallback(
    () => "Pulsera activada correctamente.",
    [],
  );

  const { scanning, modal, resultDurationMs, showKeepNearHint } = useNfcScanLoop({
    scan,
    getSuccessMessage,
  });

  const badge = useMemo(
    () => getNfcBadgeConfig(supported, enabled, canScan, scanning),
    [supported, enabled, canScan, scanning],
  );

  const isScanningActive = canScan && scanning;

  return (
    <ThemedView style={{ flex: 1 }}>
      <AnimatedBackground active={isScanningActive} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: Spacing.four,
          }}
        >
          <View className="pt-6 gap-4">
            <NfcStatusBadge badge={badge} className="mt-8" />

            <View className="gap-2">
              <ThemedText
                type="subtitle"
                className="text-[32px] text-center leading-[38px] tracking-tight"
              >
                Activar pulsera
              </ThemedText>
            </View>
          </View>

          {showKeepNearHint && (
            <View className="mt-4">
              <NfcKeepNearBanner
                message="Mantén la pulsera cerca del móvil hasta que termine la lectura."
                accentColor="#208AEF"
              />
            </View>
          )}

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ScanningAnimation active={isScanningActive} variant="hero" />
          </View>
        </View>
      </SafeAreaView>

      {modal && (
        <ScanResultModal
          visible
          type={modal.type}
          message={modal.message}
          durationMs={resultDurationMs}
        />
      )}
    </ThemedView>
  );
}
