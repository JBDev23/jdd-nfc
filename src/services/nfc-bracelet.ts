import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcTech, type NdefRecord } from 'react-native-nfc-manager';

import { playScanSound } from '@/services/scan-sounds';
import {
  type BraceletData,
  DEFAULT_BRACELET_DATA,
  type ResourceKey,
  RESOURCE_KEYS,
} from '@/types/bracelet';

export type NfcBraceletErrorCode =
  | 'nfc_unavailable'
  | 'nfc_disabled'
  | 'scan_cancelled'
  | 'invalid_data'
  | 'invalid_amount'
  | 'not_active'
  | 'read_failed'
  | 'write_failed';

export class NfcBraceletError extends Error {
  constructor(
    public readonly code: NfcBraceletErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'NfcBraceletError';
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function parseBraceletData(raw: string | null | undefined): BraceletData {
  if (!raw?.trim()) {
    return { ...DEFAULT_BRACELET_DATA };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new NfcBraceletError('invalid_data', 'La pulsera no contiene un JSON válido.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new NfcBraceletError('invalid_data', 'La pulsera no contiene un JSON válido.');
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.active !== 'boolean') {
    throw new NfcBraceletError('invalid_data', 'El campo "active" no es válido.');
  }

  for (const key of RESOURCE_KEYS) {
    if (!isPositiveInteger(data[key])) {
      throw new NfcBraceletError('invalid_data', `El campo "${key}" no es válido.`);
    }
  }

  if (!isPositiveInteger(data.team) || data.team < 1) {
    throw new NfcBraceletError('invalid_data', 'El campo "team" no es válido.');
  }

  return {
    active: data.active,
    pp: data.pp as number,
    pe: data.pe as number,
    ye: data.ye as number,
    pc: data.pc as number,
    team: data.team as number,
  };
}

function decodeNdefPayload(payload: number[] | Uint8Array): string {
  const bytes = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  return Ndef.text.decodePayload(bytes);
}

function extractTextFromTag(ndefMessage: NdefRecord[] | undefined): string | null {
  if (!ndefMessage?.length) {
    return null;
  }

  for (const record of ndefMessage) {
    if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
      return decodeNdefPayload(record.payload);
    }
  }

  return null;
}

async function ensureNfcReady(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new NfcBraceletError('nfc_unavailable', 'NFC no está disponible en web.');
  }

  const supported = await NfcManager.isSupported();
  if (!supported) {
    throw new NfcBraceletError('nfc_unavailable', 'Este dispositivo no soporta NFC.');
  }

  await NfcManager.start();

  const enabled = await NfcManager.isEnabled();
  if (!enabled) {
    throw new NfcBraceletError(
      'nfc_disabled',
      'Activa el NFC en los ajustes del móvil para continuar.',
    );
  }
}

let nfcOperationInProgress = false;

async function withNfcLock<T>(operation: () => Promise<T>): Promise<T> {
  if (nfcOperationInProgress) {
    throw new NfcBraceletError(
      'scan_cancelled',
      'Hay una operación en curso. Mantén la pulsera cerca hasta que termine.',
    );
  }

  nfcOperationInProgress = true;
  try {
    return await operation();
  } finally {
    nfcOperationInProgress = false;
  }
}

async function withNdefSession<T>(operation: () => Promise<T>): Promise<T> {
  await ensureNfcReady();

  let foregroundDispatchWasActive = false;
  if (Platform.OS === 'android') {
    try {
      await NfcManager.unregisterTagEvent();
      foregroundDispatchWasActive = true;
    } catch {
      // Foreground dispatch was not active.
    }
  }

  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    playScanSound('read');
    return await operation();
  } catch (error) {
    if (error instanceof NfcBraceletError) {
      throw error;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('cancel') || message.includes('timeout')) {
      throw new NfcBraceletError('scan_cancelled', 'Escaneo cancelado. Vuelve a intentarlo.');
    }

    throw new NfcBraceletError('read_failed', 'No se pudo leer la pulsera. Inténtalo de nuevo.');
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Ignore cleanup errors.
    }

    if (foregroundDispatchWasActive) {
      try {
        await NfcManager.registerTagEvent();
      } catch {
        // Ignore restore errors.
      }
    }
  }
}

async function readBraceletDataInSession(): Promise<BraceletData> {
  const tag = await NfcManager.getTag();
  const text = extractTextFromTag(tag?.ndefMessage);

  try {
    return parseBraceletData(text);
  } catch (error) {
    if (error instanceof NfcBraceletError) {
      throw error;
    }
    throw new NfcBraceletError('invalid_data', 'No se pudieron interpretar los datos de la pulsera.');
  }
}

async function writeBraceletDataInSession(data: BraceletData): Promise<BraceletData> {
  const payload = JSON.stringify(data);

  try {
    const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
    if (!bytes) {
      throw new NfcBraceletError('write_failed', 'No se pudo preparar el mensaje NFC.');
    }

    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    return data;
  } catch (error) {
    if (error instanceof NfcBraceletError) {
      throw error;
    }

    throw new NfcBraceletError('write_failed', 'No se pudo escribir en la pulsera. Inténtalo de nuevo.');
  }
}

export async function readBraceletData(): Promise<BraceletData> {
  return withNfcLock(() => withNdefSession(() => readBraceletDataInSession()));
}

export async function writeBraceletData(data: BraceletData): Promise<BraceletData> {
  return withNfcLock(() => withNdefSession(() => writeBraceletDataInSession(data)));
}

export async function activateBracelet(): Promise<BraceletData> {
  return withNfcLock(() =>
    withNdefSession(async () => {
      const current = await readBraceletDataInSession();
      return writeBraceletDataInSession({ ...current, active: true });
    }),
  );
}

export async function collectResource(
  resource: ResourceKey,
  amount: number,
): Promise<BraceletData> {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new NfcBraceletError(
      'invalid_amount',
      'La cantidad debe ser un entero positivo.',
    );
  }

  return withNfcLock(() =>
    withNdefSession(async () => {
      const current = await readBraceletDataInSession();

      if (!current.active) {
        throw new NfcBraceletError(
          'not_active',
          'Pulsera no activada',
        );
      }

      return writeBraceletDataInSession({
        ...current,
        active: false,
        [resource]: current[resource] + amount,
      });
    }),
  );
}

export function getNfcBraceletErrorMessage(error: unknown): string {
  if (error instanceof NfcBraceletError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado.';
}
