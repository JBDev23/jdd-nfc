import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { Modal, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

type ScanResultModalType = "success" | "error" | "not_active";

type ScanResultModalProps = {
  visible: boolean;
  type: ScanResultModalType;
  message: string;
  durationMs?: number;
};

const ACCENT = {
  success: {
    primary: "#208AEF",
    soft: "rgba(32, 138, 239, 0.16)",
    ring: "rgba(32, 138, 239, 0.4)",
    title: "¡Listo!",
    icon: {
      ios: "checkmark.circle.fill",
      android: "check_circle",
      web: "check_circle",
    },
    showPulse: true,
  },
  error: {
    primary: "#E5484D",
    soft: "rgba(229, 72, 77, 0.14)",
    ring: "rgba(229, 72, 77, 0.38)",
    title: "Error",
    icon: {
      ios: "xmark.circle.fill",
      android: "cancel",
      web: "cancel",
    },
    showPulse: false,
  },
  not_active: {
    primary: "#D97706",
    soft: "rgba(217, 119, 6, 0.16)",
    ring: "rgba(217, 119, 6, 0.38)",
    title: "Pulsera no activada",
    icon: {
      ios: "pause.circle.fill",
      android: "pause_circle",
      web: "pause_circle",
    },
    showPulse: false,
  },
} as const;

function IconPulseRing({ color }: { color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.55,
    transform: [{ scale: 0.88 + progress.value * 0.42 }],
  }));

  return (
    <Animated.View
      className="absolute size-[104px] rounded-full border-2"
      style={[{ borderColor: color }, ringStyle]}
    />
  );
}

function DismissProgress({
  durationMs,
  color,
}: {
  durationMs: number;
  color: string;
}) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: durationMs,
      easing: Easing.linear,
    });
  }, [durationMs, progress]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-3xl">
      <Animated.View
        className="h-full w-full origin-left"
        style={[{ backgroundColor: color }, barStyle]}
      />
    </View>
  );
}

export function ScanResultModal({
  visible,
  type,
  message,
  durationMs = 3500,
}: ScanResultModalProps) {
  const accent = ACCENT[type];
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    backdropOpacity.value = visible
      ? withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) })
      : 0;
  }, [visible, backdropOpacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-5">
        <Animated.View
          className="absolute inset-0"
          style={[{ backgroundColor: theme.background }, backdropStyle]}
          pointerEvents="none"
        />

        <Animated.View
          entering={FadeInDown.duration(340).springify().damping(16).stiffness(180)}
          className="w-full max-w-[420px]"
        >
          <ThemedView
            type="backgroundElement"
            className="relative items-center overflow-hidden rounded-3xl px-8 pb-9 pt-10 gap-5"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isDark ? 0.45 : 0.14,
              shadowRadius: 28,
              elevation: 16,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.09)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <View className="items-center justify-center size-[120px]">
              {accent.showPulse && <IconPulseRing color={accent.ring} />}
              <Animated.View
                entering={ZoomIn.duration(420).delay(100).springify().damping(12)}
                className="size-[88px] rounded-full items-center justify-center z-1"
                style={{ backgroundColor: accent.soft }}
              >
                <SymbolView
                  name={accent.icon}
                  size={48}
                  tintColor={accent.primary}
                />
              </Animated.View>
            </View>

            <Animated.View
              entering={FadeIn.duration(320).delay(220)}
              className="items-center gap-2.5 px-1"
            >
              <ThemedText
                type="subtitle"
                className="text-[28px] leading-[34px] text-center tracking-tight"
              >
                {accent.title}
              </ThemedText>
              {type !== "not_active" && (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="text-center leading-6 max-w-[320px]"
                >
                  {message}
                </ThemedText>
              )}
            </Animated.View>

            <DismissProgress durationMs={durationMs} color={accent.primary} />
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}
