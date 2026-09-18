import { useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type OrbConfig = {
  size: number;
  top: `${number}%`;
  left: `${number}%`;
  colorLight: string;
  colorDark: string;
  duration: number;
  phase: number;
  driftX: number;
  driftY: number;
};

const ORBS: OrbConfig[] = [
  {
    size: 320,
    top: "-8%",
    left: "-18%",
    colorLight: "rgba(32, 138, 239, 0.22)",
    colorDark: "rgba(32, 138, 239, 0.35)",
    duration: 14000,
    phase: 0,
    driftX: 36,
    driftY: 28,
  },
  {
    size: 260,
    top: "58%",
    left: "62%",
    colorLight: "rgba(99, 102, 241, 0.16)",
    colorDark: "rgba(129, 140, 248, 0.24)",
    duration: 17000,
    phase: 0.35,
    driftX: -28,
    driftY: -32,
  },
  {
    size: 200,
    top: "22%",
    left: "72%",
    colorLight: "rgba(14, 165, 233, 0.14)",
    colorDark: "rgba(56, 189, 248, 0.22)",
    duration: 12000,
    phase: 0.65,
    driftX: -22,
    driftY: 18,
  },
  {
    size: 180,
    top: "84%",
    left: "4%",
    colorLight: "rgba(32, 138, 239, 0.12)",
    colorDark: "rgba(56, 189, 248, 0.2)",
    duration: 11000,
    phase: 0.8,
    driftX: 18,
    driftY: -14,
  },
];

const TEXTURE_SPACING = 34;
const TEXTURE_DOT_SIZE = 5;

type AnimatedBackgroundProps = {
  active?: boolean;
};

function FloatingOrb({
  config,
  isDark,
  active,
}: {
  config: OrbConfig;
  isDark: boolean;
  active: boolean;
}) {
  const progress = useSharedValue(config.phase);

  useEffect(() => {
    progress.value = config.phase;
    progress.value = withRepeat(
      withTiming(config.phase + 1, {
        duration: config.duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [config.duration, config.phase, progress]);

  const orbStyle = useAnimatedStyle(() => {
    const angle = progress.value * Math.PI * 2;
    const scaleAmp = active ? 0.04 : 0.015;

    return {
      opacity: active ? 1 : 0.75,
      transform: [
        { translateX: config.driftX * Math.sin(angle) },
        { translateY: config.driftY * Math.cos(angle) },
        { scale: 1 + scaleAmp * (1 - Math.cos(angle * 2)) * 0.5 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        orbStyle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          top: config.top,
          left: config.left,
          backgroundColor: isDark ? config.colorDark : config.colorLight,
        },
      ]}
    />
  );
}

function NfcRippleRing({
  size,
  duration,
  reverse,
  color,
  opacity,
  style,
}: {
  size: number;
  duration: number;
  reverse?: boolean;
  color: string;
  opacity: number;
  style?: ViewStyle;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [duration, rotation]);

  const ringStyle = useAnimatedStyle(() => {
    const degrees = (reverse ? -rotation.value : rotation.value) * 360;
    return {
      transform: [{ rotate: `${degrees}deg` }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        ringStyle,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
        },
      ]}
    />
  );
}

function ReliefTexture({ isDark }: { isDark: boolean }) {
  const { width, height } = useWindowDimensions();

  const dots = useMemo(() => {
    const cols = Math.ceil(width / TEXTURE_SPACING) + 1;
    const rows = Math.ceil(height / TEXTURE_SPACING) + 1;
    const result: { key: string; left: number; top: number }[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if ((row + col) % 2 !== 0) continue;

        result.push({
          key: `${row}-${col}`,
          left: col * TEXTURE_SPACING,
          top: row * TEXTURE_SPACING,
        });
      }
    }

    return result;
  }, [width, height]);

  const highlight = isDark
    ? "rgba(255, 255, 255, 0.07)"
    : "rgba(255, 255, 255, 0.95)";
  const shadow = isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.07)";
  const fill = isDark ? "rgba(255, 255, 255, 0.025)" : "rgba(0, 0, 0, 0.022)";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((dot) => (
        <View
          key={dot.key}
          style={[
            styles.reliefDot,
            {
              left: dot.left,
              top: dot.top,
              width: TEXTURE_DOT_SIZE,
              height: TEXTURE_DOT_SIZE,
              backgroundColor: fill,
              borderTopColor: highlight,
              borderLeftColor: highlight,
              borderBottomColor: shadow,
              borderRightColor: shadow,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function AnimatedBackground({
  active = false,
}: AnimatedBackgroundProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const accent = isDark
    ? "rgba(32, 138, 239, 0.18)"
    : "rgba(32, 138, 239, 0.12)";
  const accentStrong = isDark
    ? "rgba(32, 138, 239, 0.28)"
    : "rgba(32, 138, 239, 0.2)";
  const accentSoft = isDark
    ? "rgba(167, 139, 250, 0.2)"
    : "rgba(139, 92, 246, 0.12)";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ReliefTexture isDark={isDark} />

      {ORBS.map((orb, index) => (
        <FloatingOrb key={index} config={orb} isDark={isDark} active={active} />
      ))}

      <View style={styles.ringsContainer}>
        <NfcRippleRing
          size={420}
          duration={48000}
          color={accent}
          opacity={active ? 0.9 : 0.55}
        />
        <NfcRippleRing
          size={520}
          duration={62000}
          reverse
          color={accentStrong}
          opacity={active ? 0.75 : 0.4}
        />
        <NfcRippleRing
          size={620}
          duration={76000}
          color={accent}
          opacity={active ? 0.55 : 0.28}
        />
        <NfcRippleRing
          size={240}
          duration={54000}
          reverse
          color={accentSoft}
          opacity={active ? 0.65 : 0.38}
          style={styles.bottomLeftRing}
        />
      </View>

      <View
        style={[
          styles.vignette,
          {
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.28)"
              : "rgba(255, 255, 255, 0.08)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
  },
  ringsContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  bottomLeftRing: {
    top: "72%",
    left: "-8%",
    alignSelf: "flex-start",
  },
  reliefDot: {
    position: "absolute",
    borderRadius: 1.5,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
  },
});
