import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type PhaseModeChipProps = {
  label: string;
  accentColor: string;
};

export function PhaseModeChip({ label, accentColor }: PhaseModeChipProps) {
  return (
    <View
      className="self-center rounded-full px-4 py-1.5"
      style={{ backgroundColor: `${accentColor}22` }}
    >
      <ThemedText
        type="smallBold"
        className="text-[13px] tracking-[2px]"
        style={{ color: accentColor }}
      >
        {label}
      </ThemedText>
    </View>
  );
}
