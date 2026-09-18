import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  // Obtenemos las medidas de los bordes del dispositivo
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 4,
          borderColor: "#0274DF",
          borderLeftWidth: 1,
          borderRightWidth: 1,
          elevation: 0,
          shadowOpacity: 0,

          paddingBottom: insets.bottom + 10,
          height: 60 + insets.bottom,
          borderRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Activar",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "antenna.radiowaves.left.and.right",
                android: "nfc",
                web: "nfc",
              }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="collect"
        options={{
          title: "Recolectar",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "tray.full.fill",
                android: "inventory_2",
                web: "inventory_2",
              }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="exchange"
        options={{
          title: "Cambiar",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "arrow.left.arrow.right",
                android: "swap_horiz",
                web: "swap_horiz",
              }}
              size={24}
              tintColor={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          href: null,
          title: "Admin",
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
