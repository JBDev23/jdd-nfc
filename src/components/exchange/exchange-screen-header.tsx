import { SymbolView } from "expo-symbols";
import { Pressable, View } from "react-native";

import { NfcKeepNearBanner } from "@/components/nfc-keep-near-banner";
import type { NfcBadgeConfig } from "@/components/nfc-status-badge";
import { NfcStatusBadge } from "@/components/nfc-status-badge";
import { PhaseModeChip } from "@/components/phase-mode-chip";
import { ThemedText } from "@/components/themed-text";
import {
  EXCHANGE_PHASE_ACCENTS,
  formatExchangeSummary,
  getExchangePhaseLabel,
  type ExchangeConfig,
  type ExchangePhase,
} from "@/lib/exchange";

type ExchangeScreenHeaderProps = {
  phase: ExchangePhase;
  badge: NfcBadgeConfig;
  config: ExchangeConfig | null;
  writeCompleted: boolean;
  showKeepNearHint: boolean;
  onOpenConfig: () => void;
  onBack: () => void;
};

export function ExchangeScreenHeader({
  phase,
  badge,
  config,
  writeCompleted,
  showKeepNearHint,
  onOpenConfig,
  onBack,
}: ExchangeScreenHeaderProps) {
  const showNfcBadge = phase === "scan" || phase === "write";
  const showConfigGear = phase === "scan";
  const showHeaderBack = phase === "confirm" || phase === "write";
  const exchangeSummary = config ? formatExchangeSummary(config) : null;

  return (
    <View className="pt-6 gap-4">
      {showNfcBadge && (
        <View className="gap-3 mt-8">
          <NfcStatusBadge badge={badge} className="self-center" />
        </View>
      )}

      <View
        className={`flex-row items-center ${phase === "config" || phase === "confirm" ? "mt-8" : ""}`}
      >
        {showConfigGear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configurar cambio"
            onPress={onOpenConfig}
            hitSlop={8}
            className="size-11 items-center justify-center rounded-full active:opacity-70"
          >
            <SymbolView
              name={{
                ios: "gearshape",
                android: "settings",
                web: "settings",
              }}
              size={22}
              tintColor="#60646C"
            />
          </Pressable>
        ) : showHeaderBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBack}
            hitSlop={8}
            className="size-11 items-center justify-center rounded-full active:opacity-70"
          >
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "arrow_back",
                web: "arrow_back",
              }}
              size={22}
              tintColor="#60646C"
            />
          </Pressable>
        ) : (
          <View className="size-11" />
        )}

        <View className="flex-1 items-center gap-2">
          <ThemedText
            type="subtitle"
            className="text-[32px] text-center leading-[38px] tracking-tight"
          >
            Cambiar
          </ThemedText>
          <PhaseModeChip
            label={getExchangePhaseLabel(phase)}
            accentColor={EXCHANGE_PHASE_ACCENTS[phase]}
          />
        </View>

        <View className="size-11" />
      </View>

      <View className="gap-3">
        {exchangeSummary && phase !== "config" && (
          <ThemedText
            type="smallBold"
            className="text-center text-[17px]"
            style={{ color: EXCHANGE_PHASE_ACCENTS.config }}
          >
            {exchangeSummary}
          </ThemedText>
        )}

        {phase === "write" && showKeepNearHint && (
          <NfcKeepNearBanner
            message="Mantén la pulsera cerca del móvil. No la apartes hasta que termine el cambio."
            accentColor={EXCHANGE_PHASE_ACCENTS.write}
          />
        )}
      </View>
    </View>
  );
}
