import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const SPLASH_BACKGROUND = '#208AEF';
const SPLASH_LOGO_SIZE = 200;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.out(Easing.cubic),
    },
    100: {
      opacity: 0,
    },
  });

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={[StyleSheet.absoluteFill, styles.container]}
    >
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{ width: SPLASH_LOGO_SIZE, height: SPLASH_LOGO_SIZE }}
          contentFit="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SPLASH_BACKGROUND,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
