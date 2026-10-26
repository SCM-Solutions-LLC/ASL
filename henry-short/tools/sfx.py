"""Synthesise the channel's sound effects.

These used to be free-plan ElevenLabs renders, which carry no commercial licence. The fix is not
to find seven CC0 files and hope their provenance holds: it is to stop having a provenance
question at all. Everything here is generated from numpy, so the output is the project's own work
and the only thing to audit is this file.

That also makes the sounds reproducible. `npm run sfx` rewrites all seven byte for byte, so a
change to one of them is a diff rather than a mystery.

The palette is deliberately synthetic. These accent a flat cut-out animation, not a documentary,
so a clean falling sine reads better than a real recording of a real door.

    npm run sfx            write every sound to public/sfx/
    npm run sfx -- pop     write one
"""

import math
import struct
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
PEAK = 0.72  # headroom: Scene.tsx mixes these under a voice-over at its own per-cue volume
OUT = Path("public/sfx")


def t(seconds: float) -> np.ndarray:
    return np.arange(int(SR * seconds)) / SR


def noise(seconds: float, seed: int) -> np.ndarray:
    return np.random.default_rng(seed).uniform(-1.0, 1.0, int(SR * seconds))


def lowpass(x: np.ndarray, hz: float, poles: int = 1) -> np.ndarray:
    """One-pole lowpass, optionally cascaded.

    One pole is 6dB/octave, which barely dents white noise: a single pole at 110Hz still leaves
    most of the energy above 4kHz, so a "rumble" built on it is hiss. Cascading gets the slope
    the low sounds actually need, at the cost of nothing that matters here.
    """
    a = math.exp(-2.0 * math.pi * hz / SR)
    for _ in range(poles):
        out = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc
            out[i] = acc
        x = out
    return x


def highpass(x: np.ndarray, hz: float, poles: int = 1) -> np.ndarray:
    return x - lowpass(x, hz, poles)


def bandpass(x: np.ndarray, lo: float, hi: float, poles: int = 1) -> np.ndarray:
    return lowpass(highpass(x, lo, poles), hi, poles)


def decay(n: int, tau: float) -> np.ndarray:
    """Exponential fall, the shape almost every percussive sound wants."""
    return np.exp(-np.arange(n) / (SR * tau))


def sweep(n: int, lo: float, hi: float, curve: float = 1.0) -> np.ndarray:
    """A sine whose pitch glides from lo to hi, integrated so the phase stays continuous."""
    f = lo + (hi - lo) * (np.arange(n) / n) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def fade_edges(x: np.ndarray, ms: float = 4.0) -> np.ndarray:
    """Every sound starts and ends at zero, or the cut itself clicks."""
    k = max(1, int(SR * ms / 1000))
    x = x.copy()
    x[:k] *= np.linspace(0, 1, k)
    x[-k:] *= np.linspace(1, 0, k)
    return x


# ---------------------------------------------------------------- the seven


def pop(d=1.0):
    """A caption or a prop arriving. Bright, over almost before it starts."""
    n = int(SR * d)
    body = sweep(n, 860, 300, curve=0.35) * decay(n, 0.045)
    click = noise(d, 1) * decay(n, 0.004) * 0.5
    return body + highpass(click, 1200)


def whoosh(d=0.8):
    """Something crossing the frame. Noise through a filter that sweeps up and back down."""
    n = int(SR * d)
    centre = np.sin(np.pi * np.arange(n) / n)  # 0 -> 1 -> 0
    raw = noise(d, 2)
    low, high = bandpass(raw, 200, 900, poles=2), bandpass(raw, 700, 3200, poles=2)
    return (low * (1 - centre) + high * centre) * (centre**1.6)


def thud(d=1.0):
    """Weight landing. The pitch drop is what sells the mass, not the volume."""
    n = int(SR * d)
    body = sweep(n, 110, 42, curve=0.5) * decay(n, 0.13)
    knock = lowpass(noise(d, 3), 420) * decay(n, 0.02)
    return body + knock * 0.6


def dirt(d=1.0):
    """Earth scattering: grains of filtered noise, thinning out."""
    n = int(SR * d)
    rng = np.random.default_rng(4)
    out = np.zeros(n)
    for _ in range(46):
        # Grains cluster early, so the sound falls away rather than stopping.
        at = int(n * rng.random() ** 0.55)
        grain = int(SR * rng.uniform(0.006, 0.022))
        if at + grain >= n:
            continue
        out[at : at + grain] += rng.uniform(0.3, 1.0) * rng.uniform(-1.0, 1.0, grain) * decay(grain, 0.006)
    return bandpass(out, 220, 1500, poles=3) * decay(n, 0.42)


def rumble(d=1.0):
    """Distant mass moving. Nearly all of this is under 120Hz."""
    n = int(SR * d)
    swell = np.sin(np.pi * np.arange(n) / n) ** 1.3
    return lowpass(noise(d, 5), 90, poles=4) * swell


def sparkle(d=1.0):
    """A small flourish: a few bell partials struck a beat apart."""
    n = int(SR * d)
    out = np.zeros(n)
    for i, (hz, at) in enumerate([(2100, 0.0), (3150, 0.055), (2640, 0.105), (4200, 0.165), (3600, 0.235)]):
        start = int(SR * at)
        tail = n - start
        ping = np.sin(2 * np.pi * hz * t(tail / SR)) + 0.4 * np.sin(2 * np.pi * hz * 2.76 * t(tail / SR))
        out[start:] += ping * decay(tail, 0.14) * (0.9 - 0.1 * i)
    return out


def ring_snap(d=2.0):
    """Metal rung and then stopped dead. The silence after the cut is the point."""
    n = int(SR * d)
    body = np.zeros(n)
    for hz, amp in [(1180, 1.0), (1790, 0.6), (2630, 0.38), (3910, 0.2)]:
        body += amp * np.sin(2 * np.pi * hz * t(d))
    body *= decay(n, 0.55)
    strike = highpass(noise(d, 6), 2000) * decay(n, 0.005)
    cut = int(SR * 0.92)
    gate = np.ones(n)
    gate[cut:] = np.exp(-np.arange(n - cut) / (SR * 0.012))  # the snap
    return (body + strike * 0.7) * gate


SOUNDS = {
    "pop": pop,
    "whoosh": whoosh,
    "thud": thud,
    "dirt": dirt,
    "rumble": rumble,
    "sparkle": sparkle,
    "ring_snap": ring_snap,
}


def write(name: str, mono: np.ndarray) -> str:
    mono = fade_edges(mono)
    peak = float(np.max(np.abs(mono)))
    if peak == 0:
        raise SystemExit(f"{name} came out silent")
    mono = mono / peak * PEAK
    frames = np.clip(np.repeat(mono[:, None], 2, axis=1), -1.0, 1.0)  # stereo, to match what it replaces
    pcm = (frames * 32767).astype("<i2")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return f"{path}: {len(mono) / SR:.2f}s, peak {20 * math.log10(PEAK):.1f} dBFS"


def main(argv: list[str]) -> int:
    wanted = argv or list(SOUNDS)
    unknown = [n for n in wanted if n not in SOUNDS]
    if unknown:
        print(f"unknown sound(s): {', '.join(unknown)}. Known: {', '.join(SOUNDS)}", file=sys.stderr)
        return 1
    for name in wanted:
        print(write(name, SOUNDS[name]()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
