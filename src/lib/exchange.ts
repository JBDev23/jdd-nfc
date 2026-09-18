import type { BraceletData, ResourceKey } from '@/types/bracelet';
import { RESOURCE_SHORT_LABELS } from '@/types/bracelet';

export type ExchangePhase = 'config' | 'scan' | 'confirm' | 'write';

export type ExchangeConfig = {
  from: ResourceKey;
  to: ResourceKey;
  rate: number;
};

export const EXCHANGE_APARTAR_DELAY_MS = 2000;
export const EXCHANGE_RATE_MIN = 0.1;
export const EXCHANGE_RATE_MAX = 2.0;
export const EXCHANGE_RATE_STEP = 0.05;

export const DEFAULT_EXCHANGE_CONFIG: ExchangeConfig = {
  from: 'pe',
  to: 'pp',
  rate: 0.9,
};

export const EXCHANGE_PHASE_ACCENTS = {
  config: '#F59E0B',
  scan: '#208AEF',
  confirm: '#9333EA',
  write: '#16A34A',
} as const;

export function applyExchange(
  data: BraceletData,
  from: ResourceKey,
  to: ResourceKey,
  amount: number,
  rate: number,
): BraceletData {
  const received = Math.floor(amount * rate);
  return {
    ...data,
    active: false,
    [from]: data[from] - amount,
    [to]: data[to] + received,
  };
}

export function formatExchangeRate(rate: number): string {
  return `×${rate.toFixed(2)}`;
}

export function formatExchangeSummary(config: ExchangeConfig): string {
  return `${RESOURCE_SHORT_LABELS[config.from]} → ${RESOURCE_SHORT_LABELS[config.to]} ${formatExchangeRate(config.rate)}`;
}

export function getExchangeReceivedAmount(amount: number, rate: number): number {
  return Math.floor(amount * rate);
}

export function getExchangePhaseLabel(phase: ExchangePhase): string {
  switch (phase) {
    case 'config':
      return 'CONFIGURACIÓN';
    case 'scan':
      return 'LECTURA';
    case 'confirm':
      return 'CONFIRMAR';
    case 'write':
      return 'ESCRITURA';
  }
}
