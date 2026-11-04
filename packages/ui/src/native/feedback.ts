// v9: one call for a moment's sound and touch: feel('picked') plays the "in the van" tone and the
// success haptic in the same frame (the picture is the caller's own animation, started alongside).
//
// - Sounds are the Pohnch tones (packages/ui/assets/sounds, made by scripts/sounds/make-tones.py):
//   loaded once, each into its own small player, and rewound on every play so they answer instantly.
// - They follow the phone: silent or vibrate mode mutes them (playsInSilentMode: false), and they mix
//   with the person's music instead of pausing it. One switch turns them off (setSoundsOn).
// - Haptics follow the table in ../feedbackTable.ts; a phone without a vibration motor skips them.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { FEEL, type FeelKind, type HapticName } from '../feedbackTable';
import { haptic } from './haptics';

const SOURCES: Record<string, number> = {
  ui_tap: require('../../assets/sounds/ui_tap.wav'),
  ui_toggle_on: require('../../assets/sounds/ui_toggle_on.wav'),
  ui_toggle_off: require('../../assets/sounds/ui_toggle_off.wav'),
  ui_sheet_up: require('../../assets/sounds/ui_sheet_up.wav'),
  ui_sheet_down: require('../../assets/sounds/ui_sheet_down.wav'),
  ui_confirm: require('../../assets/sounds/ui_confirm.wav'),
  ui_undo: require('../../assets/sounds/ui_undo.wav'),
  ui_error: require('../../assets/sounds/ui_error.wav'),
  ui_hold_1: require('../../assets/sounds/ui_hold_1.wav'),
  ui_hold_2: require('../../assets/sounds/ui_hold_2.wav'),
  ui_hold_3: require('../../assets/sounds/ui_hold_3.wav'),
  ui_hold_4: require('../../assets/sounds/ui_hold_4.wav'),
  ui_success: require('../../assets/sounds/ui_success.wav'),
  m_left: require('../../assets/sounds/m_left.wav'),
  m_arriving: require('../../assets/sounds/m_arriving.wav'),
  m_picked: require('../../assets/sounds/m_picked.wav'),
  m_reached_school: require('../../assets/sounds/m_reached_school.wav'),
  m_left_school: require('../../assets/sounds/m_left_school.wav'),
  m_dropped: require('../../assets/sounds/m_dropped.wav'),
  m_late: require('../../assets/sounds/m_late.wav'),
};

let soundsOn = true;
let ready = false;
const players = new Map<string, AudioPlayer>();

/** Sets the audio session once (silent switch respected, mixes with music). Safe to call again. */
export async function initFeedback(): Promise<void> {
  if (ready) return;
  ready = true;
  await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => undefined);
}

/** The Settings switch ("In-app sounds"). Haptics stay on either way. */
export function setSoundsOn(on: boolean) {
  soundsOn = on;
}
export function soundsAreOn(): boolean {
  return soundsOn;
}

function player(name: string): AudioPlayer | null {
  const src = SOURCES[name];
  if (src === undefined) return null;
  let p = players.get(name);
  if (!p) {
    try {
      p = createAudioPlayer(src);
      players.set(name, p);
    } catch {
      return null;
    }
  }
  return p;
}

/** Plays a sound from the kit by its file name (the Settings sound board uses this). */
export function playSound(name: string) {
  if (!soundsOn) return;
  if (!ready) void initFeedback();
  const p = player(name);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // A sound that can't play is never an error the person should see.
  }
}

function touch(h: HapticName) {
  if (h === 'none') return;
  if (h === 'knock') {
    // "At your door": two soft knocks, like the sound.
    haptic.press();
    setTimeout(() => haptic.press(), 110);
    return;
  }
  haptic[h]();
}

/** Sound and haptic for a moment, in the same frame. */
export function feel(kind: FeelKind) {
  const f = FEEL[kind];
  touch(f.haptic);
  if (f.sound) playSound(f.sound);
}

/** Loads the players ahead of time so the first sound is instant (call once at start). */
export function warmFeedback() {
  void initFeedback();
  for (const name of Object.keys(SOURCES)) player(name);
}
