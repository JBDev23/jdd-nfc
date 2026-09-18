import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, View } from 'react-native';

import { NumericStepper } from '@/components/numeric-stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  formatExchangeRate,
  getExchangeReceivedAmount,
  type ExchangeConfig,
} from '@/lib/exchange';
import {
  RESOURCE_COLORS,
  RESOURCE_LABELS,
  RESOURCE_SHORT_LABELS,
  type BraceletData,
} from '@/types/bracelet';

type ExchangeConfirmPanelProps = {
  config: ExchangeConfig;
  braceletData: BraceletData;
  amount: number;
  onChangeAmount: (amount: number) => void;
  onConfirm: () => void;
  onUseAll: () => void;
};

export function ExchangeConfirmPanel({
  config,
  braceletData,
  amount,
  onChangeAmount,
  onConfirm,
  onUseAll,
}: ExchangeConfirmPanelProps) {
  const maxAmount = braceletData[config.from];
  const received = getExchangeReceivedAmount(amount, config.rate);
  const fromColor = RESOURCE_COLORS[config.from];
  const toColor = RESOURCE_COLORS[config.to];
  const canConfirm = amount > 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 pb-12 pt-2"
      showsVerticalScrollIndicator={false}
    >
      <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-3">
        <ThemedText type="smallBold">Saldo disponible</ThemedText>
        <ThemedText
          type="title"
          className="text-[36px] leading-[40px]"
          style={{ color: fromColor }}
        >
          {maxAmount} {RESOURCE_SHORT_LABELS[config.from]}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {RESOURCE_LABELS[config.from]}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-4">
        <ThemedText type="smallBold" className="text-center">
          Cantidad a cambiar
        </ThemedText>
        <NumericStepper
          value={amount}
          min={0}
          max={maxAmount}
          onChange={onChangeAmount}
          decrementLabel="Reducir cantidad"
          incrementLabel="Aumentar cantidad"
        />
        <Pressable
          accessibilityRole="button"
          disabled={maxAmount === 0}
          onPress={onUseAll}
          className="self-center rounded-full px-4 py-2 active:opacity-80"
          style={{
            backgroundColor: `${fromColor}22`,
            opacity: maxAmount === 0 ? 0.4 : 1,
          }}
        >
          <ThemedText type="smallBold" style={{ color: fromColor }}>
            Usar todo ({maxAmount})
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-3">
        <ThemedText type="smallBold" className="text-center">
          Recibirás
        </ThemedText>
        <View className="flex-row items-center justify-center gap-3">
          <ThemedText
            type="title"
            className="text-[28px]"
            style={{ color: fromColor }}
          >
            {amount} {RESOURCE_SHORT_LABELS[config.from]}
          </ThemedText>
          <SymbolView
            name={{
              ios: 'arrow.right',
              android: 'arrow_forward',
              web: 'arrow_forward',
            }}
            size={18}
            tintColor="#60646C"
          />
          <ThemedText
            type="title"
            className="text-[28px]"
            style={{ color: toColor }}
          >
            {received} {RESOURCE_SHORT_LABELS[config.to]}
          </ThemedText>
        </View>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          className="text-center"
        >
          Tasa {formatExchangeRate(config.rate)}
        </ThemedText>
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        disabled={!canConfirm}
        onPress={onConfirm}
        className="rounded-2xl py-4 items-center active:opacity-90"
        style={{ backgroundColor: canConfirm ? '#208AEF' : '#9CA3AF' }}
      >
        <ThemedText type="smallBold" className="text-white text-[17px]">
          Confirmar cambio
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}
