import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export type NfcBadgeConfig = {
  label: string;
  tintColor: string;
  icon: "active" | "disabled";
};

export function getNfcBadgeConfig(
  supported: boolean | null,
  enabled: boolean | null,
  canScan: boolean,
  scanning: boolean,
): NfcBadgeConfig {
  if (supported === null || enabled === null) {
    return {
      label: "Comprobando NFC…",
      tintColor: "#60646C",
      icon: "active",
    };
  }

  if (!supported) {
    return {
      label: "NFC no disponible",
      tintColor: "#60646C",
      icon: "disabled",
    };
  }

  if (!enabled) {
    return {
      label: "NFC desactivado",
      tintColor: "#D97706",
      icon: "disabled",
    };
  }

  if (scanning) {
    return {
      label: "Escaneando",
      tintColor: "#208AEF",
      icon: "active",
    };
  }

  if (canScan) {
    return {
      label: "Listo para escanear",
      tintColor: "#208AEF",
      icon: "active",
    };
  }

  return {
    label: "NFC no disponible",
    tintColor: "#60646C",
    icon: "disabled",
  };
}

type NfcStatusBadgeProps = {
  badge: NfcBadgeConfig;
  className?: string;
};

export function NfcStatusBadge({ badge, className }: NfcStatusBadgeProps) {
  return (
    <ThemedView
      type="backgroundElement"
      className={[
        "self-center flex-row items-center gap-2 px-3 py-1.5 rounded-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SymbolView
        name={{
          ios:
            badge.icon === "disabled"
              ? "antenna.radiowaves.left.and.right.slash"
              : "antenna.radiowaves.left.and.right",
          android: "nfc",
          web: "nfc",
        }}
        size={14}
        tintColor={badge.tintColor}
      />
      <ThemedText type="smallBold" style={{ color: badge.tintColor }}>
        {badge.label}
      </ThemedText>
    </ThemedView>
  );
}
