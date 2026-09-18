import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@/components/animated-background";
import { NfcKeepNearBanner } from "@/components/nfc-keep-near-banner";
import {
  getNfcBadgeConfig,
  NfcStatusBadge,
} from "@/components/nfc-status-badge";
import { ScanResultModal } from "@/components/scan-result-modal";
import { ScanningAnimation } from "@/components/scanning-animation";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useNfcStatusContext } from "@/hooks/nfc-status-context";
import { useNfcScanLoop } from "@/hooks/use-nfc-scan-loop";
import { readBraceletData, writeBraceletData } from "@/services/nfc-bracelet";
import {
  resetBraceletData,
  RESOURCE_COLORS,
  RESOURCE_KEYS,
  RESOURCE_SHORT_LABELS,
  type BraceletData,
  type ResourceKey,
} from "@/types/bracelet";

type AdminPhase = "scan" | "edit" | "write";

type WriteAction = "save" | "reset";

type AdminModal = {
  type: "success" | "error" | "not_active";
  message: string;
} | null;

const APARTAR_DELAY_MS = 2000;

function AdminModeChip({
  label,
  accentColor,
}: {
  label: string;
  accentColor: string;
}) {
  return (
    <View
      className="self-center rounded-full px-4 py-1.5"
      style={{ backgroundColor: `${accentColor}22` }}
    >
      <ThemedText
        type="smallBold"
        className="text-[13px] tracking-[2px]"
        style={{ color: accentColor }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

function NumberField({
  label,
  value,
  min = 0,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  color?: string;
  onChange: (value: number) => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const glassBorder = isDark
    ? "rgba(255, 255, 255, 0.28)"
    : "rgba(0, 0, 0, 0.1)";
  const glassBg = isDark
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(255, 255, 255, 0.92)";

  return (
    <View className="flex-row items-center justify-between gap-3">
      <ThemedText
        type="smallBold"
        className="flex-1"
        style={color ? { color } : undefined}
      >
        {label}
      </ThemedText>

      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reducir ${label}`}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
          className="size-10 rounded-full items-center justify-center active:opacity-80"
          style={{
            borderWidth: 1,
            borderColor: glassBorder,
            backgroundColor: glassBg,
            opacity: value <= min ? 0.4 : 1,
          }}
        >
          <SymbolView
            name={{ ios: "minus", android: "remove", web: "remove" }}
            size={18}
            tintColor={isDark ? "#FFFFFF" : "#1C2024"}
          />
        </Pressable>

        <View
          className="min-w-[56px] items-center justify-center rounded-xl px-3 py-2"
          style={{
            borderWidth: 1,
            borderColor: glassBorder,
            backgroundColor: glassBg,
          }}
        >
          <ThemedText type="smallBold" className="text-[18px]">
            {value}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          onPress={() => onChange(value + 1)}
          className="size-10 rounded-full items-center justify-center active:opacity-80"
          style={{
            borderWidth: 1,
            borderColor: glassBorder,
            backgroundColor: glassBg,
          }}
        >
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            size={18}
            tintColor={isDark ? "#FFFFFF" : "#1C2024"}
          />
        </Pressable>
      </View>
    </View>
  );
}

function AdminEditPanel({
  data,
  onChange,
  onSave,
  onReset,
  onScanAnother,
}: {
  data: BraceletData;
  onChange: (data: BraceletData) => void;
  onSave: () => void;
  onReset: () => void;
  onScanAnother: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const updateResource = (key: ResourceKey, value: number) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 pb-12 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <ThemedText type="smallBold">Estado</ThemedText>
          <Switch
            value={data.active}
            onValueChange={(active) => onChange({ ...data, active })}
            trackColor={{ false: "#9CA3AF", true: "#208AEF" }}
          />
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {data.active ? "Activa" : "Inactiva"}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-4">
        <ThemedText type="smallBold">Recursos</ThemedText>
        {RESOURCE_KEYS.map((key) => (
          <NumberField
            key={key}
            label={RESOURCE_SHORT_LABELS[key]}
            value={data[key]}
            color={RESOURCE_COLORS[key]}
            onChange={(value) => updateResource(key, value)}
          />
        ))}
      </ThemedView>

      <ThemedView type="backgroundElement" className="rounded-2xl p-4 gap-4">
        <ThemedText type="smallBold">Equipo</ThemedText>
        <NumberField
          label="Equipo"
          value={data.team}
          min={1}
          onChange={(team) => onChange({ ...data, team })}
        />
      </ThemedView>

      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          className="rounded-2xl py-4 items-center active:opacity-90"
          style={{ backgroundColor: "#208AEF" }}
        >
          <ThemedText type="smallBold" className="text-white text-[17px]">
            Guardar en pulsera
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          className="rounded-2xl py-4 items-center active:opacity-90"
          style={{
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)",
            backgroundColor: isDark
              ? "rgba(229, 72, 77, 0.2)"
              : "rgba(229, 72, 77, 0.1)",
          }}
        >
          <ThemedText
            type="smallBold"
            className="text-[17px]"
            style={{ color: "#E5484D" }}
          >
            Reiniciar puntos
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onScanAnother}
          className="rounded-2xl py-4 items-center active:opacity-70"
        >
          <ThemedText type="smallBold" themeColor="textSecondary">
            Leer otra pulsera
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const { supported, enabled, canScan } = useNfcStatusContext();
  const [phase, setPhase] = useState<AdminPhase>("scan");
  const [editData, setEditData] = useState<BraceletData | null>(null);
  const [writeAction, setWriteAction] = useState<WriteAction | null>(null);
  const [writeCompleted, setWriteCompleted] = useState(false);
  const [adminModal, setAdminModal] = useState<AdminModal>(null);
  const [modalDurationMs, setModalDurationMs] = useState(3500);
  const [readModalActive, setReadModalActive] = useState(false);
  const [writeModalActive, setWriteModalActive] = useState(false);
  const readProcessedRef = useRef<BraceletData | null>(null);
  const writeProcessedRef = useRef<BraceletData | null>(null);
  const readTransitionScheduledRef = useRef<BraceletData | null>(null);
  const writeTransitionScheduledRef = useRef<BraceletData | null>(null);
  const readModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPhase("scan");
        setEditData(null);
        setWriteAction(null);
        setWriteCompleted(false);
        setAdminModal(null);
        setReadModalActive(false);
        setWriteModalActive(false);
        readProcessedRef.current = null;
        writeProcessedRef.current = null;
        readTransitionScheduledRef.current = null;
        writeTransitionScheduledRef.current = null;
      };
    }, []),
  );

  const readScan = useCallback(() => readBraceletData(), []);

  const writeScan = useCallback(async () => {
    if (!editData || !writeAction) {
      throw new Error("No hay datos para escribir.");
    }

    if (writeAction === "save") {
      return writeBraceletData(editData);
    }

    return writeBraceletData(resetBraceletData(editData));
  }, [editData, writeAction]);

  const getReadSuccessMessage = useCallback(
    () => "Pulsera leída correctamente.",
    [],
  );

  const getWriteSuccessMessage = useCallback(() => {
    if (writeAction === "reset") {
      return "Pulsera reiniciada. Los puntos están a 0 y el equipo se ha mantenido.";
    }
    return "Pulsera actualizada correctamente.";
  }, [writeAction]);

  const readLoop = useNfcScanLoop({
    scan: readScan,
    getSuccessMessage: getReadSuccessMessage,
    enabled: phase === "scan" && !readModalActive,
  });

  const writeLoop = useNfcScanLoop({
    scan: writeScan,
    getSuccessMessage: getWriteSuccessMessage,
    enabled:
      phase === "write" &&
      writeAction !== null &&
      !writeCompleted &&
      !writeModalActive,
    restartKey: writeAction,
  });

  useEffect(() => {
    if (phase !== "scan") {
      if (readModalTimerRef.current) {
        clearTimeout(readModalTimerRef.current);
        readModalTimerRef.current = null;
      }
      return;
    }

    if (!readLoop.lastResult) {
      return;
    }

    if (readTransitionScheduledRef.current === readLoop.lastResult) {
      return;
    }

    if (readLoop.modal?.type !== "success") {
      return;
    }

    readTransitionScheduledRef.current = readLoop.lastResult;

    const capturedResult = readLoop.lastResult;
    const capturedModal = readLoop.modal;
    const duration = readLoop.resultDurationMs;

    setReadModalActive(true);
    setAdminModal(capturedModal);
    setModalDurationMs(duration);

    if (readModalTimerRef.current) {
      clearTimeout(readModalTimerRef.current);
    }

    readModalTimerRef.current = setTimeout(() => {
      readModalTimerRef.current = null;
      readProcessedRef.current = capturedResult;
      setEditData(capturedResult);
      setAdminModal(null);
      setReadModalActive(false);
      setPhase("edit");
    }, duration);
  }, [readLoop.lastResult, readLoop.modal, phase, readLoop.resultDurationMs]);

  useEffect(() => {
    if (phase !== "write") {
      if (writeModalTimerRef.current) {
        clearTimeout(writeModalTimerRef.current);
        writeModalTimerRef.current = null;
      }
      return;
    }

    if (!writeLoop.lastResult) {
      return;
    }

    if (writeTransitionScheduledRef.current === writeLoop.lastResult) {
      return;
    }

    if (writeLoop.modal?.type !== "success") {
      return;
    }

    writeTransitionScheduledRef.current = writeLoop.lastResult;

    const capturedResult = writeLoop.lastResult;
    const capturedModal = writeLoop.modal;
    const duration = writeLoop.resultDurationMs;

    writeProcessedRef.current = capturedResult;
    setEditData(capturedResult);
    setWriteModalActive(true);
    setAdminModal(capturedModal);
    setModalDurationMs(duration);

    if (writeModalTimerRef.current) {
      clearTimeout(writeModalTimerRef.current);
    }

    writeModalTimerRef.current = setTimeout(() => {
      writeModalTimerRef.current = null;
      setAdminModal(null);
      setWriteModalActive(false);
      setWriteCompleted(true);
    }, duration);
  }, [
    writeLoop.lastResult,
    writeLoop.modal,
    phase,
    writeLoop.resultDurationMs,
  ]);

  useEffect(() => {
    if (!writeCompleted || phase !== "write") {
      return;
    }

    const timer = setTimeout(() => {
      readProcessedRef.current = readLoop.lastResult;
      writeProcessedRef.current = null;
      writeTransitionScheduledRef.current = null;
      setWriteAction(null);
      setWriteCompleted(false);
      setEditData(null);
      setPhase("scan");
    }, APARTAR_DELAY_MS);

    return () => clearTimeout(timer);
  }, [writeCompleted, phase, readLoop.lastResult]);

  const isNfcActive =
    (phase === "scan" && readLoop.scanning) ||
    (phase === "write" && writeLoop.scanning);

  const badge = useMemo(
    () => getNfcBadgeConfig(supported, enabled, canScan, isNfcActive),
    [supported, enabled, canScan, isNfcActive],
  );

  const isScanningActive =
    canScan &&
    ((phase === "scan" && readLoop.scanning) ||
      (phase === "write" && writeLoop.scanning));

  const handleBack = () => {
    if (phase === "write") {
      setWriteAction(null);
      setWriteCompleted(false);
      setWriteModalActive(false);
      setAdminModal(null);
      setPhase("edit");
      return;
    }

    if (phase === "edit") {
      readProcessedRef.current = readLoop.lastResult;
      writeProcessedRef.current = null;
      setPhase("scan");
      setEditData(null);
      return;
    }

    router.back();
  };

  const handleRequestSave = () => {
    writeProcessedRef.current = null;
    setWriteCompleted(false);
    setWriteModalActive(false);
    setAdminModal(null);
    setWriteAction("save");
    setPhase("write");
  };

  const handleRequestReset = () => {
    Alert.alert(
      "Reiniciar pulsera",
      "Se pondrán a 0 todos los puntos y la pulsera quedará inactiva. El equipo no cambiará.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            writeProcessedRef.current = null;
            setWriteCompleted(false);
            setWriteModalActive(false);
            setAdminModal(null);
            setWriteAction("reset");
            setPhase("write");
          },
        },
      ],
    );
  };

  const handleScanAnother = () => {
    if (readModalTimerRef.current) {
      clearTimeout(readModalTimerRef.current);
      readModalTimerRef.current = null;
    }
    readProcessedRef.current = null;
    readTransitionScheduledRef.current = null;
    writeProcessedRef.current = null;
    writeTransitionScheduledRef.current = null;
    setWriteAction(null);
    setWriteCompleted(false);
    setReadModalActive(false);
    setWriteModalActive(false);
    setAdminModal(null);
    setPhase("scan");
    setEditData(null);
  };

  const readAccent = "#208AEF";
  const writeAccent = writeAction === "reset" ? "#E5484D" : "#16A34A";
  const editAccent = "#9333EA";

  const nfcScreenAccent = phase === "scan" ? readAccent : writeAccent;

  const modeChip = useMemo(() => {
    if (phase === "scan") {
      return { label: "LECTURA", accentColor: readAccent };
    }
    if (phase === "edit") {
      return { label: "EDICIÓN", accentColor: editAccent };
    }
    return { label: "ESCRITURA", accentColor: writeAccent };
  }, [phase, writeAccent]);

  const subtitle =
    phase === "scan"
      ? "Acerca una pulsera para leer sus datos."
      : phase === "edit"
        ? "Modifica los atributos y guarda en la pulsera."
        : writeCompleted
          ? "Aparta la pulsera del móvil."
          : writeAction === "reset"
            ? "Acerca la pulsera para reiniciar sus puntos."
            : "Acerca la pulsera para guardar los cambios.";

  const writeBannerMessage =
    writeAction === "reset"
      ? "Mantén la pulsera cerca del móvil. No la apartes hasta que termine el reinicio."
      : "Mantén la pulsera cerca del móvil. No la apartes hasta que termine de guardar.";

  const visibleModal =
    adminModal ??
    (phase === "scan" && !readModalActive ? readLoop.modal : null) ??
    (phase === "write" && !writeModalActive ? writeLoop.modal : null);

  const visibleModalDuration =
    adminModal !== null
      ? modalDurationMs
      : phase === "scan"
        ? readLoop.resultDurationMs
        : writeLoop.resultDurationMs;

  return (
    <ThemedView style={{ flex: 1 }}>
      {(phase === "scan" || phase === "write") && (
        <AnimatedBackground active={isScanningActive} />
      )}
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: Spacing.four,
          }}
        >
          <View className="pt-6 gap-4">
            {phase === "scan" && (
              <View className="gap-3 mt-8">
                <NfcStatusBadge badge={badge} className="self-center" />
              </View>
            )}

            {phase === "write" && (
              <View className="gap-3 mt-8">
                <NfcStatusBadge badge={badge} className="self-center" />
              </View>
            )}

            <View
              className={`flex-row items-center ${phase === "edit" ? "mt-8" : ""}`}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  phase === "edit"
                    ? "Volver a lectura"
                    : phase === "write"
                      ? "Volver a editar"
                      : "Salir de admin"
                }
                onPress={handleBack}
                hitSlop={8}
                className="size-11 items-center justify-center rounded-full active:opacity-70"
              >
                <SymbolView
                  name={{
                    ios: "chevron.left",
                    android: "arrow_back",
                    web: "arrow_back",
                  }}
                  size={22}
                  tintColor="#60646C"
                />
              </Pressable>

              <View className="flex-1 items-center gap-2">
                <ThemedText
                  type="subtitle"
                  className="text-[32px] text-center leading-[38px] tracking-tight"
                >
                  ADMIN
                </ThemedText>
                <AdminModeChip
                  label={modeChip.label}
                  accentColor={modeChip.accentColor}
                />
              </View>

              <View className="size-11" />
            </View>

            <View className="gap-3">
              <ThemedText
                type="default"
                themeColor="textSecondary"
                className="text-center"
              >
                {subtitle}
              </ThemedText>

              {phase === "write" && writeLoop.showKeepNearHint && (
                <NfcKeepNearBanner
                  message={writeBannerMessage}
                  accentColor={writeAccent}
                />
              )}
            </View>
          </View>

          {phase === "scan" || phase === "write" ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ScanningAnimation
                active={isScanningActive}
                variant="hero"
                accentColor={nfcScreenAccent}
              />
            </View>
          ) : (
            editData && (
              <AdminEditPanel
                data={editData}
                onChange={setEditData}
                onSave={handleRequestSave}
                onReset={handleRequestReset}
                onScanAnother={handleScanAnother}
              />
            )
          )}
        </View>
      </SafeAreaView>

      {visibleModal && (
        <ScanResultModal
          visible
          type={visibleModal.type}
          message={visibleModal.message}
          durationMs={visibleModalDuration}
        />
      )}
    </ThemedView>
  );
}
