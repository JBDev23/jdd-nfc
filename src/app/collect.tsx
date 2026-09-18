import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { Pressable, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@/components/animated-background";
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
import { collectResource } from "@/services/nfc-bracelet";
import {
  COLLECT_RESOURCE_ORDER,
  RESOURCE_COLORS,
  RESOURCE_LABELS,
  RESOURCE_SHORT_LABELS,
  type ResourceKey,
} from "@/types/bracelet";

type CollectPhase = "config" | "scan";

type CollectConfig = {
  resource: ResourceKey;
  amount: number;
};

function GlassResourceButton({
  resource,
  selected,
  onPress,
}: {
  resource: ResourceKey;
  selected: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const color = RESOURCE_COLORS[resource];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-1 min-h-[120px] rounded-2xl overflow-hidden active:opacity-90"
      style={[
        {
          borderWidth: selected ? 2 : 1,
          borderColor: selected
            ? color
            : isDark
              ? "rgba(255, 255, 255, 0.28)"
              : "rgba(0, 0, 0, 0.12)",
          backgroundColor: isDark ? `${color}55` : `${color}40`,
        },
        selected && {
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 4,
        },
      ]}
    >
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(255, 255, 255, 0.7)",
        }}
      />
      <View className="flex-1 items-center justify-center gap-1 px-3">
        <ThemedText
          type="title"
          className="text-[36px] leading-[40px]"
          style={{ color }}
        >
          {RESOURCE_SHORT_LABELS[resource]}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          className="text-center"
        >
          {RESOURCE_LABELS[resource]}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function QuantityStepper({
  amount,
  onDecrement,
  onIncrement,
}: {
  amount: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const glassBorder = isDark
    ? "rgba(255, 255, 255, 0.28)"
    : "rgba(0, 0, 0, 0.1)";
  const glassBg = isDark
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(255, 255, 255, 0.92)";

  const stepperButtonClass =
    "size-14 rounded-full items-center justify-center active:opacity-80";

  return (
    <View className="flex-row items-center justify-center gap-6">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reducir cantidad"
        disabled={amount <= 1}
        onPress={onDecrement}
        className={stepperButtonClass}
        style={{
          borderWidth: 1,
          borderColor: glassBorder,
          backgroundColor: glassBg,
          opacity: amount <= 1 ? 0.4 : 1,
        }}
      >
        <SymbolView
          name={{ ios: "minus", android: "remove", web: "remove" }}
          size={22}
          tintColor={isDark ? "#FFFFFF" : "#1C2024"}
        />
      </Pressable>

      <View
        className="min-w-[72px] items-center justify-center rounded-2xl px-5 py-3"
        style={{
          borderWidth: 1,
          borderColor: glassBorder,
          backgroundColor: glassBg,
        }}
      >
        <ThemedText type="title" className="text-[32px] leading-[36px]">
          {amount}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
        onPress={onIncrement}
        className={stepperButtonClass}
        style={{
          borderWidth: 1,
          borderColor: glassBorder,
          backgroundColor: glassBg,
        }}
      >
        <SymbolView
          name={{ ios: "plus", android: "add", web: "add" }}
          size={22}
          tintColor={isDark ? "#FFFFFF" : "#1C2024"}
        />
      </Pressable>
    </View>
  );
}

function CollectConfigPanel({
  draft,
  onChangeResource,
  onChangeAmount,
  onConfirm,
}: {
  draft: CollectConfig;
  onChangeResource: (resource: ResourceKey) => void;
  onChangeAmount: (amount: number) => void;
  onConfirm: () => void;
}) {
  const accent = RESOURCE_COLORS[draft.resource];

  return (
    <View className="flex-1 justify-between py-2">
      <View className="gap-3 flex-1">
        <View className="flex-row gap-3 flex-1">
          {COLLECT_RESOURCE_ORDER.slice(0, 2).map((key) => (
            <GlassResourceButton
              key={key}
              resource={key}
              selected={draft.resource === key}
              onPress={() => onChangeResource(key)}
            />
          ))}
        </View>
        <View className="flex-row gap-3 flex-1">
          {COLLECT_RESOURCE_ORDER.slice(2, 4).map((key) => (
            <GlassResourceButton
              key={key}
              resource={key}
              selected={draft.resource === key}
              onPress={() => onChangeResource(key)}
            />
          ))}
        </View>
      </View>

      <View className="gap-6 pt-6">
        <View className="gap-2 items-center">
          <ThemedText type="smallBold" themeColor="textSecondary">
            Cantidad
          </ThemedText>
          <QuantityStepper
            amount={draft.amount}
            onDecrement={() => onChangeAmount(Math.max(1, draft.amount - 1))}
            onIncrement={() => onChangeAmount(draft.amount + 1)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          className="rounded-2xl py-4 items-center active:opacity-90"
          style={{
            backgroundColor: accent,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 5,
          }}
        >
          <ThemedText type="smallBold" className="text-white text-[17px]">
            Continuar
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const DEFAULT_DRAFT: CollectConfig = { resource: "pe", amount: 1 };

export default function CollectScreen() {
  const { supported, enabled, canScan } = useNfcStatusContext();
  const [phase, setPhase] = useState<CollectPhase>("config");
  const [draft, setDraft] = useState<CollectConfig>(DEFAULT_DRAFT);
  const [config, setConfig] = useState<CollectConfig | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPhase("config");
        setDraft(DEFAULT_DRAFT);
        setConfig(null);
      };
    }, []),
  );

  const scan = useCallback(
    () => collectResource(config!.resource, config!.amount),
    [config],
  );

  const getSuccessMessage = useCallback(() => {
    const { resource, amount } = config!;
    const label = RESOURCE_SHORT_LABELS[resource];
    const unit = amount === 1 ? label : `${label}`;
    return `Se ${amount === 1 ? "ha sumado" : "han sumado"} ${amount} ${unit}.`;
  }, [config]);

  const scanEnabled = phase === "scan" && config !== null;

  const { scanning, modal, resultDurationMs } = useNfcScanLoop({
    scan,
    getSuccessMessage,
    enabled: scanEnabled,
    restartKey: config,
  });

  const badge = useMemo(
    () =>
      getNfcBadgeConfig(
        supported,
        enabled,
        canScan,
        phase === "scan" && scanning,
      ),
    [supported, enabled, canScan, phase, scanning],
  );

  const isScanningActive = scanEnabled && canScan && scanning;
  const resourceSummary = config
    ? `${config.amount} ${RESOURCE_SHORT_LABELS[config.resource]}`
    : null;

  const handleConfirm = () => {
    setConfig({ ...draft });
    setPhase("scan");
  };

  const handleOpenConfig = () => {
    if (config) {
      setDraft(config);
    }
    setPhase("config");
    setConfig(null);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {phase === "scan" && <AnimatedBackground active={isScanningActive} />}
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: Spacing.four,
          }}
        >
          <View className="pt-6 gap-4">
            {phase === "scan" ? (
              <View className="gap-2">
                <View className="mt-8 flex-row items-center">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Configurar recursos"
                    onPress={handleOpenConfig}
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

                  <View className="flex-1 items-center">
                    <NfcStatusBadge badge={badge} />
                  </View>

                  <View className="size-11" />
                </View>

                <View className="gap-1">
                  <ThemedText
                    type="subtitle"
                    className="text-[32px] text-center leading-[38px] tracking-tight"
                  >
                    Recolectar
                  </ThemedText>
                  {resourceSummary && (
                    <ThemedText
                      type="smallBold"
                      className="text-center text-[17px]"
                      style={{ color: RESOURCE_COLORS[config!.resource] }}
                    >
                      {resourceSummary}
                    </ThemedText>
                  )}
                </View>
              </View>
            ) : (
              <>
                <NfcStatusBadge badge={badge} className="mt-8" />
                <View className="gap-2">
                  <ThemedText
                    type="subtitle"
                    className="text-[32px] text-center leading-[38px] tracking-tight"
                  >
                    Recolectar
                  </ThemedText>
                  <ThemedText
                    type="default"
                    themeColor="textSecondary"
                    className="text-center"
                  >
                    Elige el tipo de recurso y la cantidad.
                  </ThemedText>
                </View>
              </>
            )}
          </View>

          {phase === "config" ? (
            <CollectConfigPanel
              draft={draft}
              onChangeResource={(resource) =>
                setDraft((prev) => ({ ...prev, resource }))
              }
              onChangeAmount={(amount) =>
                setDraft((prev) => ({ ...prev, amount }))
              }
              onConfirm={handleConfirm}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ScanningAnimation active={isScanningActive} variant="hero" />
            </View>
          )}
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
