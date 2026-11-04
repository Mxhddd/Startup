#!/usr/bin/env python3
"""
Pohnch tones (v9): the app's whole sound family, made from code so it can be tuned and re-made.

  pip install numpy scipy
  python3 scripts/sounds/make-tones.py          # writes the kit into both apps + a manifest

One instrument for everything: a warm marimba/kalimba-like bar (struck wood) with a soft bell above it,
in a small room. Every note is in D major, so sounds that follow each other make music together.

  - UI sounds   (40-250 ms): tap, toggles, sheet, confirm, undo, error, hold ticks, success.
  - Moments     (0.4-1.2 s): one per trip step, the same motif growing through the day.
  - Alert tones (1-1.9 s):   the moments, longer and a little louder, for push notifications.

Where they go: UI and moment sounds into packages/ui/assets/sounds (both apps play them through
packages/ui/src/native/feedback.ts); alert tones into apps/parent/assets/sounds (bundled for pushes).

Mastering: DC removed, 3 ms fade in after the strike, smooth fade out to silence, loudness set with the
ITU-R BS.1770 K-weighting (UI -24 LUFS, moments -20, alerts -16) and a -1 dBFS peak ceiling.
The script also writes sounds.json (name, seconds, LUFS, peak) that the tests read.
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 44100
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RNG = np.random.default_rng(7)  # fixed seed: the same files every time

NOTE = {  # D major, equal temperament (A4 = 440)
    'A3': 220.00, 'B3': 246.94, 'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'A4': 440.00, 'B4': 493.88,
    'D5': 587.33, 'E5': 659.26, 'F#5': 739.99, 'A5': 880.00, 'B5': 987.77, 'D6': 1174.66, 'E6': 1318.51, 'F#6': 1479.98,
}


# ----------------------------------------------------------------------------- the instrument
def bar(freq, dur, vel=1.0, decay=1.0, bell=0.0, bright=1.0):
    """One struck bar. Marimba-like partials (1 : 4 : 10) that die away faster the higher they are,
    a short mallet thump, and an optional soft bell (2x and 3x, slightly detuned so it shimmers)."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    partials = [(1.0, 1.0, 0.9), (3.98, 0.32 * bright, 0.22), (9.85, 0.10 * bright, 0.07)]
    for ratio, amp, tau in partials:
        f = freq * ratio
        if f > SR / 2.2:
            continue
        out += amp * np.sin(2 * np.pi * f * t) * np.exp(-t / (tau * decay))
    if bell > 0:
        for ratio, amp, tau in [(2.0, 0.55, 1.6), (3.01, 0.30, 1.1), (5.43, 0.10, 0.5)]:
            f = freq * ratio
            if f > SR / 2.2:
                continue
            beat = 1 + 0.15 * np.sin(2 * np.pi * 3.2 * t)  # a gentle shimmer
            out += bell * amp * np.sin(2 * np.pi * f * t + 0.3) * np.exp(-t / (tau * decay)) * beat
    # the mallet: a few ms of soft, low-passed noise
    m = int(SR * 0.006)
    thump = RNG.standard_normal(m) * np.hanning(m * 2)[m:]
    b, a = butter(2, min(0.99, (freq * 3) / (SR / 2)))
    out[:m] += 0.18 * bright * lfilter(b, a, thump)
    # strike shape: a 1.5 ms rise so there is never a click, and a smooth fade over the last third so a
    # note cut short by its length still ends in silence (an abrupt end is a click you can hear)
    rise = int(SR * 0.0015)
    out[:rise] *= np.linspace(0, 1, rise)
    tail = max(1, n // 3)
    out[-tail:] *= np.cos(np.linspace(0, np.pi / 2, tail)) ** 2
    return vel * out


def knock(dur=0.12, vel=1.0):
    """A soft knock on a wooden door: a low, muffled thump."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 150 * t) * np.exp(-t / 0.025) + 0.5 * np.sin(2 * np.pi * 260 * t) * np.exp(-t / 0.018)
    noise = RNG.standard_normal(n) * np.exp(-t / 0.008)
    b, a = butter(2, 1800 / (SR / 2))
    x = body + 0.35 * lfilter(b, a, noise)
    x[-n // 3:] *= np.cos(np.linspace(0, np.pi / 2, len(x[-n // 3:]))) ** 2
    return vel * x


def breath(dur, rising=True, vel=1.0):
    """The sheet moving: a short swell of soft, filtered air."""
    n = int(SR * dur)
    noise = RNG.standard_normal(n)
    sos = butter(2, [500 / (SR / 2), 3200 / (SR / 2)], btype='band', output='sos')
    air = sosfilt(sos, noise)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    if not rising:
        env = env[::-1] ** 1.5
    return vel * 0.35 * air * env


def room(x, size=0.35, wet=0.16):
    """A small, warm room: a few early reflections and a soft decaying tail (synthetic impulse)."""
    n = int(SR * size)
    t = np.arange(n) / SR
    tail = RNG.standard_normal(n) * np.exp(-t / (size / 5))
    b, a = butter(1, 4500 / (SR / 2))
    tail = lfilter(b, a, tail)
    ir = np.zeros(n)
    for d, g in [(0.011, 0.5), (0.017, 0.35), (0.023, 0.25)]:
        ir[int(SR * d)] += g
    ir[int(SR * 0.012):] += 0.25 * tail[: n - int(SR * 0.012)]
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    y = np.convolve(x, ir)
    dry = np.concatenate([x, np.zeros(len(y) - len(x))])
    return (1 - wet) * dry + wet * y


def seq(events, total, size=0.35, wet=0.16):
    """events: (start seconds, signal). Returns the mix in a room: `total` seconds of notes plus a
    short part of the room's tail, so the sound rings out instead of stopping."""
    n = int(SR * total)
    full = max([n] + [int(SR * st) + len(sig) for st, sig in events])
    out = np.zeros(full)
    for start, sig in events:
        i = int(SR * start)
        out[i:i + len(sig)] += sig
    # Past `total`, everything fades away smoothly (never a hard cut), then the room rings out.
    if full > n:
        out[n:] *= np.cos(np.linspace(0, np.pi / 2, full - n)) ** 2
    return room(out, size, wet)[: full + int(SR * size * 0.5)]


# ----------------------------------------------------------------------------- mastering
def k_weight(x):
    # ITU-R BS.1770 K-weighting at 44.1 kHz (high shelf + high pass)
    b1 = [1.53090959, -2.65116903, 1.16916686]
    a1 = [1.0, -1.66375011, 0.71265753]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.98998271, 0.99000370]
    return lfilter(b2, a2, lfilter(b1, a1, x))


def lufs(x):
    y = k_weight(x)
    block, hop = int(0.4 * SR), int(0.1 * SR)
    if len(y) < block:
        y = np.concatenate([y, np.zeros(block - len(y))])
    powers = [np.mean(y[i:i + block] ** 2) for i in range(0, len(y) - block + 1, hop)]
    powers = [p for p in powers if p > 0]
    if not powers:
        return -70.0
    loud = [p for p in powers if -0.691 + 10 * np.log10(p) > -70]
    if not loud:
        return -70.0
    g = np.mean(loud)
    rel = [p for p in loud if -0.691 + 10 * np.log10(p) > -0.691 + 10 * np.log10(g) - 10]
    return float(-0.691 + 10 * np.log10(np.mean(rel or loud)))


def master(x, target, fade_out=0.04):
    x = x - np.mean(x)
    f = int(SR * fade_out)
    x[-f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    x[: int(SR * 0.0008)] *= np.linspace(0, 1, int(SR * 0.0008))
    gain = 10 ** ((target - lufs(x)) / 20)
    x = x * gain
    peak = np.max(np.abs(x))
    ceiling = 10 ** (-1 / 20)
    if peak > ceiling:  # a gentle limiter: scale down rather than clip
        x *= ceiling / peak
    return x


def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((data * 32767).astype('<i2').tobytes())


# ----------------------------------------------------------------------------- the kit
def N(name, d=0.6, v=1.0, **k):
    return bar(NOTE[name], d, v, **k)


def ui():
    return {
        'tap': seq([(0, N('A5', 0.09, 0.7, decay=0.12, bright=0.6))], 0.09, 0.15, 0.05),
        'toggle_on': seq([(0, N('E5', 0.08, 0.6, decay=0.12)), (0.045, N('A5', 0.1, 0.7, decay=0.14))], 0.15, 0.15, 0.06),
        'toggle_off': seq([(0, N('A5', 0.08, 0.6, decay=0.12)), (0.045, N('E5', 0.1, 0.6, decay=0.14))], 0.15, 0.15, 0.06),
        'sheet_up': seq([(0, breath(0.18, True)), (0.06, N('D4', 0.16, 0.25, decay=0.2))], 0.22, 0.2, 0.08),
        'sheet_down': seq([(0, breath(0.16, False)), (0.02, N('A3', 0.16, 0.22, decay=0.2))], 0.2, 0.2, 0.08),
        'confirm': seq([(0, N('F#5', 0.2, 0.7, decay=0.25)), (0.06, N('A5', 0.22, 0.8, decay=0.3, bell=0.25))], 0.25, 0.25, 0.1),
        'undo': seq([(0, N('A5', 0.12, 0.6, decay=0.18)), (0.055, N('F#5', 0.12, 0.55, decay=0.18)), (0.11, N('D5', 0.14, 0.5, decay=0.22))], 0.25, 0.2, 0.08),
        'error': seq([(0, N('B3', 0.18, 0.7, decay=0.2, bright=0.4)), (0.11, N('B3', 0.18, 0.55, decay=0.2, bright=0.4))], 0.25, 0.2, 0.06),
        'hold_1': seq([(0, N('D5', 0.07, 0.45, decay=0.1))], 0.07, 0.12, 0.04),
        'hold_2': seq([(0, N('E5', 0.07, 0.5, decay=0.1))], 0.07, 0.12, 0.04),
        'hold_3': seq([(0, N('F#5', 0.07, 0.55, decay=0.1))], 0.07, 0.12, 0.04),
        'hold_4': seq([(0, N('A5', 0.08, 0.6, decay=0.12))], 0.08, 0.12, 0.04),
        'success': seq([(0, N('D5', 0.3, 0.6)), (0.045, N('F#5', 0.3, 0.6)), (0.09, N('A5', 0.3, 0.65)), (0.135, N('D6', 0.4, 0.7, bell=0.35))], 0.42, 0.25, 0.1),
    }


def moments(scale=1.0, wet=0.16, size=0.4):
    """The trip steps. scale > 1 makes the longer alert versions (more sustain and room)."""
    s = scale
    return {
        # van left: two notes rising, "off we go"
        'left': seq([(0, N('A4', 0.7 * s, 0.75, decay=0.9 * s)), (0.12, N('D5', 0.8 * s, 0.85, decay=1.0 * s, bell=0.2))], 0.55 * s, size, wet),
        # arriving: a soft knock-knock, then a bell
        'arriving': seq([(0, knock(0.1, 0.9)), (0.11, knock(0.1, 0.75)), (0.3, N('D6', 0.9 * s, 0.7, decay=1.1 * s, bell=0.6))], 0.75 * s + 0.15, size, wet),
        # picked: three warm notes, "in the van"
        'picked': seq([(0, N('D5', 0.8 * s, 0.75, decay=0.9 * s)), (0.11, N('F#5', 0.8 * s, 0.75, decay=0.9 * s)), (0.22, N('A5', 0.9 * s, 0.85, decay=1.1 * s, bell=0.25))], 0.7 * s + 0.1, size, wet),
        # reached school: the signature "پہنچ" (short, short, long) ending on the bell
        'reached_school': seq([(0, N('A5', 0.5 * s, 0.75, decay=0.6 * s)), (0.1, N('F#5', 0.5 * s, 0.7, decay=0.6 * s)), (0.2, N('B5', 0.6 * s, 0.8, decay=0.7 * s)),
                               (0.36, N('D6', 1.2 * s, 0.95, decay=1.5 * s, bell=0.8))], 1.0 * s + 0.2, size * 1.2, wet * 1.2),
        # left school: two notes falling, heading home
        'left_school': seq([(0, N('A5', 0.7 * s, 0.75, decay=0.9 * s)), (0.12, N('D5', 0.8 * s, 0.8, decay=1.0 * s, bell=0.2))], 0.55 * s, size, wet),
        # dropped home: a rolled, resolving D major chord over a low D, with the bell on top
        'dropped': seq([(0, N('D4', 1.2 * s, 0.6, decay=1.3 * s)), (0.04, N('D5', 1.0 * s, 0.6)), (0.08, N('F#5', 1.0 * s, 0.6)), (0.12, N('A5', 1.0 * s, 0.65)),
                        (0.2, N('D6', 1.2 * s, 0.75, decay=1.4 * s, bell=0.7))], 1.0 * s + 0.2, size * 1.2, wet * 1.2),
        # late: one low, soft note; information, never an alarm
        'late': seq([(0, N('A3', 0.9 * s, 0.8, decay=1.2 * s, bright=0.5)), (0.14, N('D4', 0.9 * s, 0.5, decay=1.2 * s, bright=0.5))], 0.7 * s + 0.1, size, wet),
    }


def main():
    manifest = []
    shared = os.path.join(ROOT, 'packages', 'ui', 'assets', 'sounds')  # UI and moment sounds, both apps
    alerts = os.path.join(ROOT, 'apps', 'parent', 'assets', 'sounds')  # push tones, bundled by the parent app

    def emit(group, name, x, target, dirs):
        y = master(x, target)
        for d in dirs:
            write(os.path.join(d, f'{name}.wav'), y)
        manifest.append({'group': group, 'name': name, 'seconds': round(len(y) / SR, 3), 'lufs': round(lufs(y), 1),
                         'peak_db': round(20 * np.log10(np.max(np.abs(y)) + 1e-12), 2),
                         'edge': round(float(max(abs(y[0]), abs(y[-1]))), 5)})

    for name, x in ui().items():
        emit('ui', f'ui_{name}', x, -24, [shared])
    for name, x in moments().items():
        emit('moment', f'm_{name}', x, -20, [shared])
    for name, x in moments(scale=1.4, wet=0.2, size=0.55).items():
        emit('alert', f'a_{name}', x, -16, [alerts])
    with open(os.path.join(ROOT, 'packages', 'ui', 'src', 'sounds.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
        f.write('\n')
    print(f'wrote {len(manifest)} sounds')


if __name__ == '__main__':
    main()
