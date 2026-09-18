import { SymbolView } from "expo-symbols";
import { useColorScheme, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

type NfcKeepNearBannerProps = {
  message: string;
  accentColor?: string;
};

export function NfcKeepNearBanner({
  message,
  accentColor = "#208AEF",
}: NfcKeepNearBannerProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View
      className="flex-row items-center gap-2.5 rounded-xl px-3.5 py-3"
      style={{
        backgroundColor: isDark ? `${accentColor}2E` : `${accentColor}1A`,
        borderWidth: 1,
        borderColor: isDark ? `${accentColor}59` : `${accentColor}38`,
      }}
    >
      <SymbolView
        name={{
          ios: "iphone.radiowaves.left.and.right",
          android: "nfc",
          web: "nfc",
        }}
        size={18}
        tintColor={accentColor}
      />
      <ThemedText
        type="small"
        className="flex-1 leading-5"
        style={{ color: accentColor }}
      >
        {message}
      </ThemedText>
    </View>
  );
}
