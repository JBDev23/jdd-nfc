import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";

const RING_COUNT = 3;
const PULSE_DURATION = 1800;

const VARIANTS = {
  default: {
    ring: "size-[140px]",
    icon: "size-[72px]",
    iconText: "text-[22px] leading-[26px]",
  },
  hero: {
    ring: "size-[220px]",
    icon: "size-[96px]",
    iconText: "text-[28px] leading-[32px]",
  },
} as const;

type ScanningAnimationVariant = keyof typeof VARIANTS;

function PulseRing({
  delay,
  ringClassName,
  borderColor,
}: {
  delay: number;
  ringClassName: string;
  borderColor: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: PULSE_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: Math.sin(progress.value * Math.PI),
    transform: [{ scale: 0.55 + progress.value * 0.9 }],
  }));

  return (
    <Animated.View
      className={ringClassName}
      style={[ringStyle, { borderColor }]}
    />
  );
}

const INACTIVE_RING_OPACITIES = [0.35, 0.25, 0.15];
const INACTIVE_RING_SCALES = [0.7, 0.85, 1];

type ScanningAnimationProps = {
  active?: boolean;
  variant?: ScanningAnimationVariant;
  accentColor?: string;
  label?: string;
};

export function ScanningAnimation({
  active = true,
  variant = "default",
  accentColor = "#208AEF",
  label = "NFC",
}: ScanningAnimationProps) {
  const sizes = VARIANTS[variant];
  const ringClassName = `absolute ${sizes.ring} rounded-full border-2`;
  const iconProgress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      iconProgress.value = withTiming(0, { duration: 200, easing: Easing.linear });
      return;
    }

    iconProgress.value = 0;
    iconProgress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [active, iconProgress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: active
          ? 1 + 0.04 * (1 - Math.cos(iconProgress.value * Math.PI * 2))
          : 1,
      },
    ],
  }));

  return (
    <View
      className={["items-center gap-4", variant === "default" && "py-4 flex-1"]
        .filter(Boolean)
        .join(" ")}
    >
      <View className={`${sizes.ring} items-center justify-center`}>
        {active
          ? Array.from({ length: RING_COUNT }, (_, index) => (
              <PulseRing
                key={index}
                delay={index * (PULSE_DURATION / RING_COUNT)}
                ringClassName={ringClassName}
                borderColor={accentColor}
              />
            ))
          : INACTIVE_RING_OPACITIES.map((opacity, index) => (
              <View
                key={index}
                className={ringClassName}
                style={{
                  opacity,
                  transform: [{ scale: INACTIVE_RING_SCALES[index] }],
                  borderColor: "#B0B4BA",
                }}
              />
            ))}
        <Animated.View
          className={[sizes.icon, "rounded-full items-center justify-center z-[1]"]
            .filter(Boolean)
            .join(" ")}
          style={[
            iconStyle,
            { backgroundColor: active ? accentColor : "#B0B4BA" },
          ]}
        >
          <ThemedText
            type="title"
            className={["text-white", sizes.iconText, !active && "opacity-85"]
              .filter(Boolean)
              .join(" ")}
          >
            {label}
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}
