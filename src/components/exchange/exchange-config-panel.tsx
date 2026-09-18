import { SymbolView } from "expo-symbols";
import { Pressable, View } from "react-native";

import { NumericStepper } from "@/components/numeric-stepper";
import { ResourcePicker } from "@/components/resource-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  EXCHANGE_RATE_MAX,
  EXCHANGE_RATE_MIN,
  EXCHANGE_RATE_STEP,
  formatExchangeRate,
  type ExchangeConfig,
} from "@/lib/exchange";
import { RESOURCE_COLORS, RESOURCE_SHORT_LABELS, type ResourceKey } from "@/types/bracelet";

type ExchangeConfigPanelProps = {
  draft: ExchangeConfig;
  onChange: (draft: ExchangeConfig) => void;
  onConfirm: () => void;
};

function handleFromChange(
  draft: ExchangeConfig,
  from: ResourceKey,
): ExchangeConfig {
  if (from === draft.to) {
    return { ...draft, from, to: draft.from };
  }
  return { ...draft, from };
}

function handleToChange(draft: ExchangeConfig, to: ResourceKey): ExchangeConfig {
  if (to === draft.from) {
    return { ...draft, from: draft.to, to };
  }
  return { ...draft, to };
}

export function ExchangeConfigPanel({
  draft,
  onChange,
  onConfirm,
}: ExchangeConfigPanelProps) {
  const canConfirm = draft.from !== draft.to;
  const accent = RESOURCE_COLORS[draft.from];

  return (
    <View className="flex-1 justify-between py-4">
      <View className="gap-6">
        <ResourcePicker
          label="De"
          value={draft.from}
          onChange={(from) => onChange(handleFromChange(draft, from))}
        />

        <View className="items-center">
          <SymbolView
            name={{
              ios: "arrow.down",
              android: "arrow_downward",
              web: "arrow_downward",
            }}
            size={20}
            tintColor="#60646C"
          />
        </View>

        <ResourcePicker
          label="A"
          value={draft.to}
          onChange={(to) => onChange(handleToChange(draft, to))}
        />

        <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-3">
          <ThemedText type="smallBold" className="text-center">
            Tasa de cambio
          </ThemedText>
          <NumericStepper
            value={draft.rate}
            min={EXCHANGE_RATE_MIN}
            max={EXCHANGE_RATE_MAX}
            step={EXCHANGE_RATE_STEP}
            onChange={(rate) => onChange({ ...draft, rate })}
            formatValue={formatExchangeRate}
            decrementLabel="Reducir tasa"
            incrementLabel="Aumentar tasa"
            valueMinWidth={88}
            valueClassName="text-[28px] leading-[32px]"
          />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="text-center"
          >
            1 {RESOURCE_SHORT_LABELS[draft.from]} ={" "}
            {formatExchangeRate(draft.rate).replace("×", "")}{" "}
            {RESOURCE_SHORT_LABELS[draft.to]}
          </ThemedText>
        </ThemedView>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canConfirm}
        onPress={onConfirm}
        className="rounded-2xl py-4 items-center active:opacity-90 mt-6"
        style={{
          backgroundColor: canConfirm ? accent : "#9CA3AF",
          shadowColor: canConfirm ? accent : undefined,
          shadowOffset: canConfirm ? { width: 0, height: 6 } : undefined,
          shadowOpacity: canConfirm ? 0.3 : undefined,
          shadowRadius: canConfirm ? 14 : undefined,
          elevation: canConfirm ? 5 : 0,
        }}
      >
        <ThemedText type="smallBold" className="text-white text-[17px]">
          Continuar
        </ThemedText>
      </Pressable>
    </View>
  );
}
