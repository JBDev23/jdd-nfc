import "@/global.css";

import { Michroma_400Regular, useFonts } from "@expo-google-fonts/michroma";
import { DarkTheme, DefaultTheme, ThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { NfcDisabledBanner } from "@/components/nfc-disabled-banner";
import {
  NfcStatusProvider,
  useNfcStatusContext,
} from "@/hooks/nfc-status-context";
import { useNfcForeground } from "@/hooks/use-nfc-foreground";
import { useSecretTap } from "@/hooks/use-secret-tap";
import { configureScanSounds } from "@/services/scan-sounds";

SplashScreen.preventAutoHideAsync().catch(() => {});

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const nfcStatus = useNfcStatusContext();
  const router = useRouter();
  const onSecretTap = useSecretTap(() => router.push("/admin"));

  const insets = useSafeAreaInsets();

  useNfcForeground();

  useEffect(() => {
    void configureScanSounds();
  }, []);

  const showNfcDisabledBanner =
    nfcStatus.supported === true && nfcStatus.enabled === false;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      {showNfcDisabledBanner && (
        <NfcDisabledBanner
          onOpenSettings={() => void nfcStatus.openSettings()}
        />
      )}

      <View style={{ flex: 1, position: "relative" }}>
        <View
          pointerEvents="box-none"
          style={{ paddingTop: insets.top + 10 }}
          className="absolute top-0 left-0 right-0 z-50 items-center justify-center bg-transparent"
        >
          <Pressable onPress={onSecretTap} hitSlop={12} accessibilityRole="button">
            <Text
              className="text-2xl tracking-widest text-blue-600 dark:text-blue-400 uppercase shadow-sm shadow-black/20"
              style={{ fontFamily: "Michroma_400Regular" }}
            >
              JDD NFC
            </Text>
          </Pressable>
        </View>

        <AppTabs />
      </View>
    </ThemeProvider>
  );
}

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Michroma_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NfcStatusProvider>
      <TabLayoutContent />
    </NfcStatusProvider>
  );
}
