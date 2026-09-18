import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type NumericStepperProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  decrementLabel?: string;
  incrementLabel?: string;
  valueMinWidth?: number;
  valueClassName?: string;
};

function roundToStep(value: number, step: number): number {
  const precision = step < 1 ? Math.round(1 / step) : 1;
  return Math.round(value * precision) / precision;
}

export function NumericStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
  decrementLabel = 'Reducir',
  incrementLabel = 'Aumentar',
  valueMinWidth = 72,
  valueClassName = 'text-[32px] leading-[36px]',
}: NumericStepperProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.28)'
    : 'rgba(0, 0, 0, 0.1)';
  const glassBg = isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(255, 255, 255, 0.92)';

  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;

  const decrement = () => {
    if (!canDecrement) return;
    const next = roundToStep(value - step, step);
    onChange(min !== undefined ? Math.max(min, next) : next);
  };

  const increment = () => {
    if (!canIncrement) return;
    const next = roundToStep(value + step, step);
    onChange(max !== undefined ? Math.min(max, next) : next);
  };

  return (
    <View className="flex-row items-center justify-center gap-6">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decrementLabel}
        disabled={!canDecrement}
        onPress={decrement}
        className="size-14 rounded-full items-center justify-center active:opacity-80"
        style={{
          borderWidth: 1,
          borderColor: glassBorder,
          backgroundColor: glassBg,
          opacity: canDecrement ? 1 : 0.4,
        }}
      >
        <SymbolView
          name={{ ios: 'minus', android: 'remove', web: 'remove' }}
          size={22}
          tintColor={isDark ? '#FFFFFF' : '#1C2024'}
        />
      </Pressable>

      <View
        className="items-center justify-center rounded-2xl px-5 py-3"
        style={{
          minWidth: valueMinWidth,
          borderWidth: 1,
          borderColor: glassBorder,
          backgroundColor: glassBg,
        }}
      >
        <ThemedText type="title" className={valueClassName}>
          {formatValue(value)}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={incrementLabel}
        disabled={!canIncrement}
        onPress={increment}
        className="size-14 rounded-full items-center justify-center active:opacity-80"
        style={{
          borderWidth: 1,
          borderColor: glassBorder,
          backgroundColor: glassBg,
          opacity: canIncrement ? 1 : 0.4,
        }}
      >
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={22}
          tintColor={isDark ? '#FFFFFF' : '#1C2024'}
        />
      </Pressable>
    </View>
  );
}
