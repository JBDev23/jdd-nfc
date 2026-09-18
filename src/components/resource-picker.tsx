import { Pressable, useColorScheme, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  COLLECT_RESOURCE_ORDER,
  RESOURCE_COLORS,
  RESOURCE_SHORT_LABELS,
  type ResourceKey,
} from "@/types/bracelet";

type ResourceChipProps = {
  resource: ResourceKey;
  selected: boolean;
  onPress: () => void;
};

function ResourceChip({ resource, selected, onPress }: ResourceChipProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const color = RESOURCE_COLORS[resource];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-1 rounded-xl py-3 items-center active:opacity-90"
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected
          ? color
          : isDark
            ? "rgba(255, 255, 255, 0.28)"
            : "rgba(0, 0, 0, 0.12)",
        backgroundColor: selected
          ? isDark
            ? `${color}44`
            : `${color}30`
          : isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(255, 255, 255, 0.85)",
      }}
    >
      <ThemedText
        type="smallBold"
        className="text-[16px]"
        style={{ color: selected ? color : undefined }}
      >
        {RESOURCE_SHORT_LABELS[resource]}
      </ThemedText>
    </Pressable>
  );
}

type ResourcePickerProps = {
  label: string;
  value: ResourceKey;
  onChange: (resource: ResourceKey) => void;
};

export function ResourcePicker({
  label,
  value,
  onChange,
}: ResourcePickerProps) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {COLLECT_RESOURCE_ORDER.map((key) => (
          <ResourceChip
            key={key}
            resource={key}
            selected={value === key}
            onPress={() => onChange(key)}
          />
        ))}
      </View>
    </View>
  );
}
