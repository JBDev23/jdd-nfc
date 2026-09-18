import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

type NfcDisabledBannerProps = {
  onOpenSettings: () => void;
};

export function NfcDisabledBanner({ onOpenSettings }: NfcDisabledBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-start gap-2 px-4 pb-2 bg-amber-100 border-b border-amber-200"
      style={{ paddingTop: insets.top + 8 }}>
      <View className="size-8 rounded-full items-center justify-center bg-amber-200 mt-0.5">
        <SymbolView
          name={{ ios: 'antenna.radiowaves.left.and.right.slash', android: 'nfc', web: 'nfc' }}
          size={20}
          tintColor="#92400E"
        />
      </View>
      <View className="flex-1 gap-1">
        <ThemedText type="smallBold" className="text-amber-800">
          NFC desactivado
        </ThemedText>
        <ThemedText type="small" className="text-amber-800">
          Activa el NFC en los ajustes del móvil para escanear pulseras.
        </ThemedText>
        {Platform.OS === 'android' && (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenSettings}
            className="self-start mt-0.5 px-2 py-1 rounded bg-amber-500 active:opacity-85">
            <ThemedText type="smallBold" className="text-white">
              Abrir ajustes NFC
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
