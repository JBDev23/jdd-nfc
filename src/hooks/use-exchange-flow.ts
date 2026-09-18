import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getNfcBadgeConfig } from '@/components/nfc-status-badge';
import { useNfcStatusContext } from '@/hooks/nfc-status-context';
import { useNfcScanLoop } from '@/hooks/use-nfc-scan-loop';
import {
  applyExchange,
  DEFAULT_EXCHANGE_CONFIG,
  EXCHANGE_APARTAR_DELAY_MS,
  EXCHANGE_PHASE_ACCENTS,
  getExchangeReceivedAmount,
  type ExchangeConfig,
  type ExchangePhase,
} from '@/lib/exchange';
import {
  NfcBraceletError,
  readBraceletData,
  writeBraceletData,
} from '@/services/nfc-bracelet';
import { RESOURCE_SHORT_LABELS, type BraceletData } from '@/types/bracelet';

type ExchangeModal = {
  type: 'success' | 'error' | 'not_active';
  message: string;
} | null;

export function useExchangeFlow() {
  const { supported, enabled, canScan } = useNfcStatusContext();
  const [phase, setPhase] = useState<ExchangePhase>('config');
  const [draft, setDraft] = useState<ExchangeConfig>(DEFAULT_EXCHANGE_CONFIG);
  const [config, setConfig] = useState<ExchangeConfig | null>(null);
  const [braceletData, setBraceletData] = useState<BraceletData | null>(null);
  const [amount, setAmount] = useState(0);
  const [writeData, setWriteData] = useState<BraceletData | null>(null);
  const [writeCompleted, setWriteCompleted] = useState(false);
  const [exchangeModal, setExchangeModal] = useState<ExchangeModal>(null);
  const [modalDurationMs, setModalDurationMs] = useState(3500);
  const [readModalActive, setReadModalActive] = useState(false);
  const [writeModalActive, setWriteModalActive] = useState(false);
  const readTransitionScheduledRef = useRef<BraceletData | null>(null);
  const writeTransitionScheduledRef = useRef<BraceletData | null>(null);
  const readModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFlow = useCallback(() => {
    setPhase('config');
    setDraft(DEFAULT_EXCHANGE_CONFIG);
    setConfig(null);
    setBraceletData(null);
    setAmount(0);
    setWriteData(null);
    setWriteCompleted(false);
    setExchangeModal(null);
    setReadModalActive(false);
    setWriteModalActive(false);
    readTransitionScheduledRef.current = null;
    writeTransitionScheduledRef.current = null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      return resetFlow;
    }, [resetFlow]),
  );

  const readScan = useCallback(async () => {
    const data = await readBraceletData();
    if (!data.active) {
      throw new NfcBraceletError('not_active', 'Pulsera no activada');
    }
    return data;
  }, []);

  const writeScan = useCallback(async () => {
    if (!writeData) {
      throw new Error('No hay datos para escribir.');
    }
    return writeBraceletData(writeData);
  }, [writeData]);

  const getReadSuccessMessage = useCallback(
    () => 'Pulsera leída correctamente.',
    [],
  );

  const getWriteSuccessMessage = useCallback(() => {
    if (!config) {
      return 'Cambio realizado correctamente.';
    }
    const received = getExchangeReceivedAmount(amount, config.rate);
    return `Cambio realizado: ${amount} ${RESOURCE_SHORT_LABELS[config.from]} → ${received} ${RESOURCE_SHORT_LABELS[config.to]}.`;
  }, [config, amount]);

  const readLoop = useNfcScanLoop({
    scan: readScan,
    getSuccessMessage: getReadSuccessMessage,
    enabled: phase === 'scan' && !readModalActive,
    restartKey: config,
  });

  const writeLoop = useNfcScanLoop({
    scan: writeScan,
    getSuccessMessage: getWriteSuccessMessage,
    enabled: phase === 'write' && !writeCompleted && !writeModalActive,
    restartKey: writeData,
  });

  useEffect(() => {
    if (phase !== 'scan') {
      if (readModalTimerRef.current) {
        clearTimeout(readModalTimerRef.current);
        readModalTimerRef.current = null;
      }
      return;
    }

    if (!readLoop.lastResult || readLoop.modal?.type !== 'success') {
      return;
    }

    if (readTransitionScheduledRef.current === readLoop.lastResult) {
      return;
    }

    const capturedResult = readLoop.lastResult;
    readTransitionScheduledRef.current = capturedResult;
    const capturedModal = readLoop.modal;
    const duration = readLoop.resultDurationMs;

    setReadModalActive(true);
    setExchangeModal(capturedModal);
    setModalDurationMs(duration);

    if (readModalTimerRef.current) {
      clearTimeout(readModalTimerRef.current);
    }

    readModalTimerRef.current = setTimeout(() => {
      readModalTimerRef.current = null;
      setBraceletData(capturedResult);
      setAmount(0);
      setExchangeModal(null);
      setReadModalActive(false);
      setPhase('confirm');
    }, duration);
  }, [readLoop.lastResult, readLoop.modal, phase, readLoop.resultDurationMs]);

  useEffect(() => {
    if (phase !== 'write') {
      if (writeModalTimerRef.current) {
        clearTimeout(writeModalTimerRef.current);
        writeModalTimerRef.current = null;
      }
      return;
    }

    if (!writeLoop.lastResult || writeLoop.modal?.type !== 'success') {
      return;
    }

    if (writeTransitionScheduledRef.current === writeLoop.lastResult) {
      return;
    }

    writeTransitionScheduledRef.current = writeLoop.lastResult;
    const capturedModal = writeLoop.modal;
    const duration = writeLoop.resultDurationMs;

    setWriteModalActive(true);
    setExchangeModal(capturedModal);
    setModalDurationMs(duration);

    if (writeModalTimerRef.current) {
      clearTimeout(writeModalTimerRef.current);
    }

    writeModalTimerRef.current = setTimeout(() => {
      writeModalTimerRef.current = null;
      setExchangeModal(null);
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
    if (!writeCompleted || phase !== 'write') {
      return;
    }

    const timer = setTimeout(() => {
      writeTransitionScheduledRef.current = null;
      readTransitionScheduledRef.current = null;
      setWriteCompleted(false);
      setWriteData(null);
      setBraceletData(null);
      setAmount(0);
      setPhase('scan');
    }, EXCHANGE_APARTAR_DELAY_MS);

    return () => clearTimeout(timer);
  }, [writeCompleted, phase]);

  const isNfcActive =
    (phase === 'scan' && readLoop.scanning) ||
    (phase === 'write' && writeLoop.scanning);

  const badge = useMemo(
    () => getNfcBadgeConfig(supported, enabled, canScan, isNfcActive),
    [supported, enabled, canScan, isNfcActive],
  );

  const isScanningActive =
    canScan &&
    ((phase === 'scan' && readLoop.scanning) ||
      (phase === 'write' && writeLoop.scanning));

  const nfcScreenAccent =
    phase === 'scan'
      ? EXCHANGE_PHASE_ACCENTS.scan
      : EXCHANGE_PHASE_ACCENTS.write;

  const handleConfirmConfig = useCallback(() => {
    setConfig({ ...draft });
    readTransitionScheduledRef.current = null;
    setBraceletData(null);
    setAmount(0);
    setPhase('scan');
  }, [draft]);

  const handleOpenConfig = useCallback(() => {
    if (config) {
      setDraft(config);
    }
    readTransitionScheduledRef.current = null;
    writeTransitionScheduledRef.current = null;
    setBraceletData(null);
    setWriteData(null);
    setAmount(0);
    setWriteCompleted(false);
    setExchangeModal(null);
    setReadModalActive(false);
    setWriteModalActive(false);
    setConfig(null);
    setPhase('config');
  }, [config]);

  const handleBack = useCallback(() => {
    if (phase === 'write') {
      writeTransitionScheduledRef.current = null;
      setWriteCompleted(false);
      setWriteModalActive(false);
      setWriteData(null);
      setExchangeModal(null);
      setPhase('confirm');
      return;
    }

    if (phase === 'confirm') {
      readTransitionScheduledRef.current = null;
      setBraceletData(null);
      setAmount(0);
      setPhase('scan');
      return;
    }

    if (phase === 'scan') {
      handleOpenConfig();
    }
  }, [phase, handleOpenConfig]);

  const handleConfirmAmount = useCallback(() => {
    if (!config || !braceletData || amount <= 0) {
      return;
    }

    writeTransitionScheduledRef.current = null;
    setWriteCompleted(false);
    setWriteModalActive(false);
    setExchangeModal(null);
    setWriteData(
      applyExchange(braceletData, config.from, config.to, amount, config.rate),
    );
    setPhase('write');
  }, [config, braceletData, amount]);

  const visibleModal =
    exchangeModal ??
    (phase === 'scan' && !readModalActive ? readLoop.modal : null) ??
    (phase === 'write' && !writeModalActive ? writeLoop.modal : null);

  const visibleModalDuration =
    exchangeModal !== null
      ? modalDurationMs
      : phase === 'scan'
        ? readLoop.resultDurationMs
        : writeLoop.resultDurationMs;

  return {
    phase,
    draft,
    setDraft,
    config,
    braceletData,
    amount,
    setAmount,
    badge,
    isScanningActive,
    nfcScreenAccent,
    writeCompleted,
    showKeepNearHint: writeLoop.showKeepNearHint,
    visibleModal,
    visibleModalDuration,
    handleConfirmConfig,
    handleOpenConfig,
    handleBack,
    handleConfirmAmount,
  };
}
