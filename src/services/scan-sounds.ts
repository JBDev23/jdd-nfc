import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import { Platform } from 'react-native';

export type ScanSound = 'read' | 'success' | 'error';

const PLAYER_OPTIONS = {
  keepAudioSessionActive: true,
  downloadFirst: true,
} as const;

const SOUND_SOURCES = {
  read: require('../../assets/sounds/read.wav'),
  success: require('../../assets/sounds/success.wav'),
  error: require('../../assets/sounds/error.wav'),
} as const satisfies Record<ScanSound, number>;

let audioModeConfigured = false;
const players = new Map<ScanSound, AudioPlayer>();

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured || Platform.OS === 'web') {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
  });
  audioModeConfigured = true;
}

const SOUND_VOLUME: Record<ScanSound, number> = {
  read: 0.8,
  success: 0.8,
  error: 0.8,
};

function getPlayer(type: ScanSound): AudioPlayer {
  let player = players.get(type);
  if (!player) {
    player = createAudioPlayer(SOUND_SOURCES[type], PLAYER_OPTIONS);
    player.volume = SOUND_VOLUME[type];
    players.set(type, player);
  }
  return player;
}

export async function configureScanSounds(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await ensureAudioMode();
    await setIsAudioActiveAsync(true);
    for (const type of Object.keys(SOUND_SOURCES) as ScanSound[]) {
      getPlayer(type);
    }
  } catch {
    // Audio is optional feedback; ignore setup failures.
  }
}

export function playScanSound(type: ScanSound): void {
  if (Platform.OS === 'web') {
    return;
  }

  void (async () => {
    try {
      await ensureAudioMode();
      await setIsAudioActiveAsync(true);

      for (const [key, player] of players) {
        if (key !== type) {
          player.pause();
        }
      }

      const player = getPlayer(type);
      player.volume = SOUND_VOLUME[type];
      player.pause();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore playback failures.
    }
  })();
}
