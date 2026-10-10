"""Build the film soundtrack: original music, synthesized SFX, processed voice-over, mix and master.

Usage (from video/): pnpm audio
Reads out/audio/timeline.json (scripts/export-timeline.ts) and public/audio/vo/*.flac.
Writes public/audio/mix.wav plus stems in out/audio/stems/.
Everything except the VO lines is synthesized here, so the soundtrack has no third-party samples.
"""

import json
import zlib
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, istft, lfilter, resample_poly, sosfilt, stft

ROOT = Path(__file__).resolve().parents[2]
SR = 48000
TL = json.loads((ROOT / "out/audio/timeline.json").read_text())
DUR = TL["duration"]
N = int(DUR * SR)
MUS = TL["music"]

# ---------------------------------------------------------------- utilities


def rng_for(*key) -> np.random.Generator:
    # Stable across processes (Python's hash() is salted).
    return np.random.default_rng(zlib.crc32(repr(("yieldex",) + key).encode()))


def tvec(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def sos(kind: str, fc, order: int = 2):
    return butter(order, fc, btype=kind, fs=SR, output="sos")


def filt(x: np.ndarray, kind: str, fc, order: int = 2) -> np.ndarray:
    return sosfilt(sos(kind, fc, order), x, axis=0)


def pan(mono: np.ndarray, p0: float = 0.0, p1: float | None = None) -> np.ndarray:
    p = np.linspace(p0, p0 if p1 is None else p1, len(mono))
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def place(bus: np.ndarray, sig: np.ndarray, t: float, gain: float = 1.0) -> None:
    i = int(round(t * SR))
    if sig.ndim == 1:
        sig = pan(sig)
    j = min(len(bus), i + len(sig))
    if i < 0 or i >= len(bus):
        return
    bus[i:j] += sig[: j - i] * gain


def exp_env(n: int, tau: float, attack: float = 0.002) -> np.ndarray:
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / tau)


def sweep(f0: float, f1: float, n: int, curve: str = "exp") -> np.ndarray:
    """Phase of a sine sweeping from f0 to f1."""
    x = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** x if curve == "exp" else f0 + (f1 - f0) * x
    return 2 * np.pi * np.cumsum(f) / SR


def noise(n: int, key) -> np.ndarray:
    return rng_for("noise", key).standard_normal(n)


def band_sweep(x: np.ndarray, centers: np.ndarray, q: float = 0.7) -> np.ndarray:
    """Time-varying band-pass via STFT masking; centers is sampled per output frame."""
    f, _, z = stft(x, SR, nperseg=1024)
    c = np.interp(np.linspace(0, 1, z.shape[1]), np.linspace(0, 1, len(centers)), centers)
    width = np.maximum(c * q, 60)
    z *= np.exp(-(((f[:, None] - c[None, :]) / width[None, :]) ** 2))
    _, y = istft(z, SR, nperseg=1024)
    return y[: len(x)]


def reverb_ir(seconds: float, tau: float, key, damp: float = 6000) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([noise(n, (key, "L")), noise(n, (key, "R"))], axis=1) * np.exp(-t / tau)[:, None]
    ir = filt(ir, "lowpass", damp, 1)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt(np.sum(ir**2) / 2)


def reverb(stereo: np.ndarray, ir: np.ndarray, wet: float) -> np.ndarray:
    mono = stereo.mean(axis=1)
    out = np.stack([fftconvolve(mono, ir[:, 0])[: len(mono)], fftconvolve(mono, ir[:, 1])[: len(mono)]], axis=1)
    return stereo + out * wet


def smooth_env(x: np.ndarray, attack: float, release: float, hop: int = 64) -> np.ndarray:
    """Fast envelope: compute on a decimated grid, then interpolate."""
    frames = np.abs(x[: len(x) // hop * hop]).reshape(-1, hop).max(axis=1)
    a = np.exp(-hop / (attack * SR))
    r = np.exp(-hop / (release * SR))
    env = np.empty_like(frames)
    y = 0.0
    for i, v in enumerate(frames):
        c = a if v > y else r
        y = c * y + (1 - c) * v
        env[i] = y
    return np.interp(np.arange(len(x)), np.arange(len(env)) * hop, env)


# ---------------------------------------------------------------- instruments

TABLE = 4096
_phase_grid = np.arange(TABLE) / TABLE


def saw_table(harmonics: int, rolloff: float) -> np.ndarray:
    k = np.arange(1, harmonics + 1)
    w = np.exp(-(k - 1) / rolloff) / k
    tab = (np.sin(2 * np.pi * np.outer(_phase_grid, k)) * w).sum(axis=1)
    return tab / np.abs(tab).max()


DARK = saw_table(6, 1.2)
BRIGHT = saw_table(28, 7.0)


def osc(freq, n: int, bright: np.ndarray | float, phase0: float = 0.0) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    ph = (phase0 + np.cumsum(f) / SR) % 1.0
    idx = ph * TABLE
    d = np.interp(idx, np.arange(TABLE + 1), np.append(DARK, DARK[0]))
    b = np.interp(idx, np.arange(TABLE + 1), np.append(BRIGHT, BRIGHT[0]))
    w = np.broadcast_to(np.asarray(bright, dtype=float), (n,))
    return d * (1 - w) + b * w


def pad_chord(notes, dur: float, b0: float, b1: float, key, attack=0.8, release=1.6) -> np.ndarray:
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    bright = np.clip(np.interp(t, [0, dur], [b0, b1]), 0, 1) * 0.85
    out = np.zeros((n, 2))
    r = rng_for("pad", key)
    for i, m in enumerate(notes):
        for v, cents in enumerate((-7, 0, 6)):
            f = hz(m) * 2 ** (cents / 1200) * (1 + 0.0015 * np.sin(2 * np.pi * (0.13 + 0.05 * v) * t + r.random() * 6))
            s = osc(f, n, bright, r.random())
            out += pan(s, (-0.6 + 0.6 * v) * 0.8 + (i - 2) * 0.05)
    env = np.minimum(1, t / attack) * np.clip((dur + release - t) / release, 0, 1)
    return out * env[:, None] / (len(notes) * 3) * 2.2


def pluck(midi: float, key, decay: float = 0.45, brightness: float = 1.0, length: float = 1.2) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    b = np.clip(brightness * np.exp(-t / 0.09), 0, 1)
    s = 0.6 * osc(hz(midi), n, b) + 0.4 * osc(hz(midi) * 1.004, n, b, 0.3)
    return s * exp_env(n, decay, 0.003)


def kick(gain: float = 1.0) -> np.ndarray:
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    click = filt(noise(n, "kick"), "highpass", 3000) * np.exp(-t / 0.0025) * 0.25
    return np.tanh((body + click) * 1.4) * gain


def hat(key, gain: float = 1.0, tau: float = 0.022) -> np.ndarray:
    n = int(0.12 * SR)
    return filt(noise(n, ("hat", key)), "highpass", 7500, 2) * exp_env(n, tau, 0.0005) * gain


def clap(key, gain: float = 1.0) -> np.ndarray:
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = filt(noise(n, ("clap", key)), "bandpass", [1100, 3200], 2)
    env = np.zeros(n)
    for k, d in enumerate((0.0, 0.009, 0.018)):
        env += np.where(t >= d, np.exp(-(t - d) / (0.006 if k < 2 else 0.11)), 0) * (0.7 if k < 2 else 1.0)
    return x * env * gain


def bass_note(midi: float, dur: float) -> np.ndarray:
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * osc(f, n, 0.2)
    env = np.minimum(1, t / 0.008) * np.clip((dur + 0.08 - t) / 0.08, 0, 1) * (0.75 + 0.25 * np.exp(-t / 0.15))
    return np.tanh(s * 1.3) * env


def bell(freq: float, decay: float = 1.2, n_s: float | None = None, partials=(1, 2.0, 2.76, 4.07, 5.4)) -> np.ndarray:
    length = n_s or decay * 3
    n = int(length * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for k, p in enumerate(partials):
        s += np.sin(2 * np.pi * freq * p * t) * np.exp(-t / (decay / (1 + k * 0.8))) / (1 + k * 0.7)
    return s * np.minimum(1, t / 0.002)


# ---------------------------------------------------------------- music

CHORDS = {
    "Dmaj9": [50, 57, 61, 64, 66],
    "Bm9": [50, 54, 57, 59, 61],
    "Gmaj9": [55, 57, 59, 62, 66],
    "Asus": [52, 57, 59, 64, 66],
    "Glyd": [55, 59, 61, 62, 66],
    "Em9": [52, 55, 59, 62, 66],
    "A": [52, 57, 61, 64, 69],
}
ROOTS = {"Dmaj9": 38, "Bm9": 35, "Gmaj9": 31, "Asus": 33, "Glyd": 31, "Em9": 40, "A": 33}

M0 = MUS["marketStart"]
BEAT = (MUS["boom"] - M0) / 120  # the logo hit lands on a downbeat
BAR = BEAT * 4


def grid(start: float, end: float, step: float = 1.0, offset: float = 0.0):
    k0 = int(np.ceil((start - M0) / (BEAT * step) - offset - 1e-6))
    out = []
    k = k0
    while True:
        t = M0 + (k + offset) * BEAT * step
        if t >= end:
            return out
        if t >= start - 1e-6:
            out.append((k, t))
        k += 1


def chord_at(t: float):
    if t < MUS["problem"]:
        return "Dmaj9"
    if t < MUS["idea"]:
        return "Bm9"
    if t < MUS["reveal"]:
        return "Gmaj9"
    if t < M0:
        return "Dmaj9"
    if t < MUS["aiStart"]:
        return ["Dmaj9", "Bm9", "Gmaj9", "Asus"][int((t - M0) // BAR) % 4]
    if t < MUS["numbersStart"]:
        return ["Glyd", "Em9"][int((t - MUS["aiStart"]) // (BAR * 2)) % 2]
    if t < MUS["closeStart"]:
        return ["Bm9", "Gmaj9", "Em9", "Asus"][int((t - MUS["numbersStart"]) // BAR) % 4]
    if t < MUS["boom"]:
        return "Asus" if t < MUS["boom"] - BAR * 1.0 else "A"
    return "Dmaj9"


def brightness_at(t: float) -> float:
    pts = [
        (0, 0.25), (MUS["problem"], 0.3), (MUS["problem"] + 0.5, 0.12), (MUS["idea"], 0.2), (MUS["reveal"], 0.6),
        (M0 - 0.2, 0.75), (M0, 0.4), (MUS["purchase"], 0.5), (MUS["lapse"], 0.55), (MUS["event1"], 0.85),
        (MUS["event1"] + 1, 0.55), (MUS["wide"], 0.6), (MUS["aiStart"] - 0.5, 0.8), (MUS["aiStart"], 0.5),
        (MUS["numbersStart"], 0.35), (MUS["zero"], 0.3), (MUS["zero"] + 0.2, 0.1), (MUS["closeStart"], 0.25),
        (MUS["boom"] - 0.05, 1.0), (MUS["boom"], 0.9), (DUR, 0.5),
    ]
    xs, ys = zip(*pts)
    return float(np.interp(t, xs, ys))


def build_music() -> dict[str, np.ndarray]:
    pads = np.zeros((N + SR * 3, 2))
    arps = np.zeros_like(pads)
    bass = np.zeros_like(pads)
    drums = np.zeros_like(pads)

    # Pads: one segment per chord change, crossfaded by attack/release overlap.
    bounds = [0.0]
    step = 0.05
    for t in np.arange(step, DUR, step):
        if chord_at(t) != chord_at(t - step):
            bounds.append(round(t, 3))
    bounds.append(DUR)
    for i in range(len(bounds) - 1):
        a, b = bounds[i], bounds[i + 1]
        name = chord_at(a + 0.01)
        seg = pad_chord(CHORDS[name], b - a, brightness_at(a), brightness_at(b), (i, name), attack=0.35 if a else 1.5)
        place(pads, seg, a)
    # Low drone under the "nothing at all" drop-out.
    zn = int((MUS["closeStart"] - MUS["zero"]) * SR)
    drone = np.sin(2 * np.pi * hz(26) * np.arange(zn) / SR) * np.minimum(1, np.arange(zn) / (0.2 * SR)) * 0.35
    # Pads drop out for "or nothing at all", then return into the close.
    t_all = np.arange(len(pads)) / SR
    gate = np.clip(1 - (t_all - MUS["zero"] - 0.05) / 0.25, 0, 1) + np.clip((t_all - MUS["closeStart"] + 0.5) / 0.5, 0, 1)
    pads *= np.clip(gate, 0, 1)[:, None]
    place(pads, drone, MUS["zero"])

    # Arpeggio: chord tones high up; density follows the story.
    for k, t in grid(0.4, DUR - 2.0, 0.25):
        name = chord_at(t)
        tones = sorted({(m % 12) for m in CHORDS[name]})
        intro = t < M0
        ai = MUS["aiStart"] <= t < MUS["numbersStart"]
        if intro and (t < MUS["reveal"] and k % 4 != 0):
            continue
        if intro and k % 2 != 0:
            continue
        if ai and k % 2 != 0:
            continue
        if MUS["zero"] <= t < MUS["closeStart"]:
            continue
        if t >= MUS["boom"] and (k % 4 != 0 or t > MUS["boom"] + BAR * 1.5):
            continue
        if MUS["wide"] + BAR <= t < MUS["aiStart"] and k % 2:
            continue
        pattern = [0, 2, 1, 3, 2, 4, 1, 3]
        idx = pattern[k % len(pattern)] % len(tones)
        octave = 74 if not ai else 79
        midi = octave + ((tones[idx] - octave) % 12)
        if k % 8 == 5:
            midi += 12
        gain = 0.5 if intro else 0.75 if ai else (0.6 if t < MUS["purchase"] else 0.85)
        p = pluck(midi, (k,), decay=0.32 if not ai else 0.6, brightness=brightness_at(t))
        place(arps, pan(p, 0.35 if k % 2 else -0.35), t, gain)

    # Bass + drums.
    for k, t in grid(M0, DUR - 0.5, 0.5):
        name = chord_at(t + 0.01)
        in_ai = MUS["aiStart"] <= t < MUS["numbersStart"]
        in_zero = MUS["zero"] <= t < MUS["closeStart"]
        if in_zero:
            continue
        if t >= MUS["boom"]:
            if abs(t - MUS["boom"]) < 1e-3:
                place(bass, bass_note(ROOTS[name], BAR * 2), t, 0.9)
            continue
        if in_ai:
            if (t - MUS["aiStart"]) % (BAR * 2) < BEAT * 0.5:
                place(bass, bass_note(ROOTS[name], BAR * 2 - 0.1), t, 0.55)
            continue
        if MUS["wide"] + BAR <= t < MUS["aiStart"]:
            continue
        place(bass, bass_note(ROOTS[name] + (12 if k % 4 == 3 else 0), BEAT * 0.42), t, 0.55)

    for k, t in grid(M0, MUS["boom"] + 0.01, 0.5):
        beat = k % 2 == 0
        q = (k // 2) % 4
        in_ai = MUS["aiStart"] <= t < MUS["numbersStart"]
        if in_ai or MUS["zero"] <= t < MUS["closeStart"]:
            continue
        lapse = MUS["lapse"] <= t < MUS["event1"]
        wide = MUS["wide"] + BAR <= t < MUS["aiStart"]
        numbers = MUS["numbersStart"] <= t < MUS["closeStart"]
        close = MUS["closeStart"] <= t < MUS["boom"]
        if abs(t - MUS["boom"]) < 1e-3:
            place(drums, kick(1.2), t)
            continue
        if beat and not lapse and not wide:
            g = 0.55 if t < MUS["purchase"] else 0.8
            if numbers:
                g = 0.5
            if close:
                g = 0.6 + 0.4 * (t - MUS["closeStart"]) / (MUS["boom"] - MUS["closeStart"])
            place(drums, kick(g), t)
        if close and not beat and t > MUS["boom"] - BAR * 2:
            place(drums, kick(0.45), t)
        if not beat and not lapse and not numbers and t > M0 + BAR and not wide:
            place(drums, pan(hat(k, 0.5), 0.25), t)
        if numbers and not beat:
            place(drums, pan(hat(k, 0.35, 0.012), -0.2), t)
        if beat and q in (1, 3) and MUS["purchase"] <= t < MUS["wide"] + BAR and not lapse:
            place(drums, pan(clap(k, 0.7), 0.05), t)
    # Snare roll into the logo.
    roll_start = MUS["boom"] - BAR
    for i in range(32):
        frac = i / 32
        t = roll_start + BAR * (1 - (1 - frac) ** 1.6)
        place(drums, pan(clap(("roll", i), 0.15 + 0.6 * frac), 0.1), t)

    # Sidechain pump from the kicks onto pads/bass/arps.
    kicks = np.zeros(len(pads))
    for k, t in grid(M0, MUS["boom"] + 0.01, 1.0):
        if MUS["aiStart"] <= t < MUS["numbersStart"] or MUS["zero"] <= t < MUS["closeStart"]:
            continue
        if MUS["wide"] + BAR <= t < MUS["aiStart"] or MUS["lapse"] <= t < MUS["event1"]:
            continue
        i = int(t * SR)
        kicks[i] = 1
    pump = 1 - 0.38 * np.clip(lfilter([1], [1, -np.exp(-1 / (0.13 * SR))], kicks), 0, 1)
    pads *= pump[:, None]
    bass *= pump[:, None]
    arps *= (0.5 + 0.5 * pump)[:, None]

    hall = reverb_ir(3.2, 0.9, "hall", 5000)
    room = reverb_ir(1.2, 0.3, "room", 7000)
    pads = reverb(pads, hall, 0.45)
    # Stereo ping-pong delay on the arps before the hall.
    d = int(BEAT * 0.75 * SR)
    delayed = np.zeros_like(arps)
    for tap, (gl, gr) in enumerate([(0.0, 0.42), (0.3, 0.0), (0.0, 0.18), (0.1, 0.0)], start=1):
        delayed[tap * d :, 0] += arps[: -tap * d, 0] * gl + arps[: -tap * d, 1] * gl
        delayed[tap * d :, 1] += arps[: -tap * d, 0] * gr + arps[: -tap * d, 1] * gr
    arps = reverb(arps + filt(delayed, "lowpass", 5000), hall, 0.35)
    drums = reverb(drums, room, 0.18)
    bass = filt(bass, "lowpass", 900)

    music = pads * 0.9 + arps * 0.5 + bass * 0.55 + drums * 0.7
    music = music[:N]
    fade = np.ones(N)
    fade[-int(1.6 * SR) :] = np.linspace(1, 0, int(1.6 * SR)) ** 2
    fade[: int(0.6 * SR)] = np.linspace(0, 1, int(0.6 * SR))
    return {"music": music * fade[:, None]}


# ---------------------------------------------------------------- sound effects


def whoosh(dur: float, key, lo: float = 500, hi: float = 3800, q: float = 0.6) -> np.ndarray:
    n = max(int(dur * SR), 2048)
    x = noise(n, ("whoosh", key))
    u = np.linspace(0, 1, 64)
    centers = lo + (hi - lo) * np.sin(np.pi * np.clip(u * 1.15, 0, 1)) ** 1.5
    y = band_sweep(x, centers, q)
    s = np.linspace(0, 1, n)
    env = (s**0.9) * (1 - s) ** 1.6
    return y * env / (np.abs(y * env).max() + 1e-9)


def sfx(name: str, cue: dict, idx: int) -> np.ndarray:
    pitch = cue.get("pitch") or 1.0
    dur = cue.get("dur") or 0.5
    key = (name, idx)
    if name in ("whoosh", "swish"):
        d = dur if name == "whoosh" else 0.32
        return whoosh(d, key, 700 * pitch, 5200 * pitch) * 0.8
    if name == "whooshLow":
        return whoosh(dur, key, 180, 1400, 0.8)
    if name == "whooshBig":
        w = whoosh(dur + 0.4, key, 250, 4200, 0.9)
        n = len(w)
        sub = np.sin(sweep(90, 40, n)) * np.linspace(0, 1, n) ** 2 * 0.5
        return w + sub
    if name == "riser":
        n = int(dur * SR)
        s = np.linspace(0, 1, n)
        x = band_sweep(noise(n, key), 300 * (20 ** np.linspace(0, 1, 64)), 0.5)
        tone = osc(220 * 4 ** s, n, 0.5) * 0.25
        return (x * 0.8 + tone) * s**2.2
    if name in ("impact", "boom", "impactSoft"):
        big = name == "boom"
        soft = name == "impactSoft"
        length = 3.5 if big else 1.6 if not soft else 1.0
        n = int(length * SR)
        t = np.arange(n) / SR
        f0, f1 = (75, 30) if big else (95, 38) if not soft else (150 * pitch, 60)
        sub = np.sin(sweep(f0, f1, n)) * np.exp(-t / (1.2 if big else 0.5 if not soft else 0.22))
        hit = filt(noise(n, key), "lowpass", 2500 if not soft else 4000) * np.exp(-t / (0.09 if big else 0.05))
        out = sub * (1.0 if not soft else 0.6) + hit * (0.6 if not soft else 0.35)
        if big:
            out += sum(bell(hz(m), 2.5, length) * 0.12 for m in (74, 78, 81, 86))
        if soft:
            out += bell(hz(86) * pitch, 0.6, length) * 0.12
        return np.tanh(out * 1.2)
    if name == "pop":
        n = int(0.14 * SR)
        return np.sin(sweep(520 * pitch, 980 * pitch, n)) * exp_env(n, 0.035, 0.002) * 0.7
    if name in ("click", "tick"):
        n = int(0.09 * SR)
        f = (1500 if name == "click" else 2600) * pitch
        tr = filt(noise(n, key), "bandpass", [2000, 7000]) * exp_env(n, 0.0025, 0.0003)
        tone = np.sin(2 * np.pi * f * np.arange(n) / SR) * exp_env(n, 0.018 if name == "click" else 0.01)
        return tr * 0.6 + tone * (0.5 if name == "click" else 0.35)
    if name in ("clink", "coinLand"):
        base = (2100 if name == "clink" else 1500) * pitch
        n = int(0.9 * SR)
        out = np.zeros(n)
        hits = [(0, 1.0)] if name == "clink" else [(0, 1.0), (0.07, 0.45), (0.12, 0.25)]
        for d, g in hits:
            b = bell(base * (1 + d), 0.22, 0.9 - d, partials=(1, 2.76, 5.4, 8.93))
            out[int(d * SR) : int(d * SR) + len(b)] += b[: n - int(d * SR)] * g
        out[: int(0.004 * SR)] += filt(noise(int(0.004 * SR), key), "highpass", 4000) * 0.5
        return out * 0.6
    if name in ("lock", "thunk"):
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        body = np.sin(sweep(170, 85, n)) * np.exp(-t / 0.09)
        if name == "thunk":
            return body * 0.9 + filt(noise(n, key), "lowpass", 900) * np.exp(-t / 0.03) * 0.4
        clack = np.zeros(n)
        for d in (0.0, 0.065):
            c = bell(1100, 0.05, 0.5, partials=(1, 2.3, 3.7, 5.1))
            i = int(d * SR)
            clack[i : i + len(c)] += c[: n - i]
        shink = bell(3200, 0.25, 0.6, partials=(1, 1.5, 2.1)) * 0.25
        return body * 0.7 + clack * 0.6 + shink[:n]
    if name in ("shimmer", "glint", "sparkle"):
        length = dur + 1.2 if name == "shimmer" else 1.2 if name == "glint" else 1.4
        n = int(length * SR)
        out = np.zeros(n)
        r = rng_for("shim", key)
        notes = [86, 90, 93, 98, 102, 105] if name != "glint" else [98, 102, 105, 110]
        count = 14 if name == "sparkle" else 8 if name == "shimmer" else 4
        span = dur if name == "shimmer" else 0.7 if name == "sparkle" else 0.12
        for i in range(count):
            d = (i / count) * span + r.random() * 0.03
            b = bell(hz(r.choice(notes)) * pitch, 0.35 if name != "shimmer" else 0.6, length - d, partials=(1, 2.0, 3.0))
            g = (0.5 + 0.5 * r.random()) * (np.sin(np.pi * (i + 0.5) / count) if name == "shimmer" else 1)
            out[int(d * SR) : int(d * SR) + len(b)] += b * g
        return out * (0.35 if name == "sparkle" else 0.3)
    if name == "chime":
        n = int(2.8 * SR)
        out = np.zeros(n)
        for i, m in enumerate((86, 90, 93, 98)):
            b = bell(hz(m) * pitch, 1.1, 2.8 - i * 0.06)
            d = int(i * 0.06 * SR)
            out[d : d + len(b)] += b * (0.5 if i < 3 else 0.3)
        return out * 0.4
    if name == "hum":
        n = int((dur + 0.4) * SR)
        t = np.arange(n) / SR
        s = osc(110, n, 0.4) + 0.5 * osc(165, n, 0.3)
        s = filt(s, "lowpass", 1200) * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * t))
        env = np.minimum(1, t / 0.3) * np.clip((dur + 0.4 - t) / 0.4, 0, 1)
        return s * env * 0.35
    if name == "timelapse":
        n = int((dur + 0.4) * SR)
        out = whoosh(dur + 0.4, key, 400, 2500) * 0.35
        t, gap = 0.0, 0.22
        while t < dur:
            c = sfx("tick", {"pitch": 1.4 + t / dur * 0.6}, idx)
            i = int(t * SR)
            out[i : i + len(c)] += c[: n - i] * 0.7
            t += gap
            gap = max(0.045, gap * 0.82)
        return out
    if name == "drop":
        n = int(max(dur, 0.3) * SR)
        return np.sin(sweep(2200, 700, n)) * np.linspace(0.2, 1, n) * 0.35
    if name == "aiTone":
        n = int(3.0 * SR)
        t = np.arange(n) / SR
        out = np.zeros(n)
        for i, m in enumerate((67, 71, 74, 78, 83)):
            mod = np.sin(2 * np.pi * hz(m) * 2 * t) * 1.5 * np.exp(-t / 0.6)
            out += np.sin(2 * np.pi * hz(m) * t + mod) * np.exp(-t / 1.4) * np.minimum(1, t / (0.02 + i * 0.04))
        return out * 0.18
    if name == "typing":
        n = int((dur + 0.2) * SR)
        out = np.zeros(n)
        r = rng_for("type", key)
        t = 0.0
        while t < dur:
            m = int(0.04 * SR)
            k = filt(noise(m, (key, t)), "bandpass", [1200, 4500]) * exp_env(m, 0.006, 0.0005)
            k += np.sin(2 * np.pi * 180 * np.arange(m) / SR) * exp_env(m, 0.012) * 0.5
            i = int(t * SR)
            out[i : i + m] += k[: n - i] * (0.6 + 0.4 * r.random())
            t += 0.055 + r.random() * 0.06
        return out * 0.5
    if name == "thinking":
        n = int((dur + 0.2) * SR)
        out = np.zeros(n)
        r = rng_for("think", key)
        t = 0.0
        while t < dur:
            m = int(0.06 * SR)
            b = np.sin(2 * np.pi * (700 + r.random() * 900) * np.arange(m) / SR) * exp_env(m, 0.015)
            out[int(t * SR) : int(t * SR) + m] += b[: n - int(t * SR)]
            t += 0.08
        return out * 0.25
    if name == "swell":
        n = int(dur * SR)
        s = np.linspace(0, 1, n)
        x = filt(noise(n, key), "bandpass", [900, 9000])
        rev = bell(hz(86), 1.4, dur)[::-1][:n] * 0.3
        return (x * 0.45 + rev) * s**3
    if name in ("dialUp", "dialDown"):
        n = int(max(dur, 0.3) * SR)
        f0, f1 = (300, 900) if name == "dialUp" else (700 * pitch, 260 * pitch)
        s = np.linspace(0, 1, n)
        return np.sin(sweep(f0, f1, n)) * np.sin(np.pi * s) ** 0.6 * 0.4 + whoosh(n / SR, key, 600, 2000) * 0.15
    if name == "subDrop":
        n = int(1.6 * SR)
        t = np.arange(n) / SR
        return np.sin(sweep(95, 28, n)) * np.exp(-t / 0.7)
    if name == "zap":
        n = int(0.4 * SR)
        t = np.arange(n) / SR
        return (osc(np.geomspace(180, 2400, n), n, 0.6) * 0.4 + filt(noise(n, key), "highpass", 3000) * 0.2) * np.exp(-t / 0.12)
    if name == "block":
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        thud = np.sin(sweep(150 * pitch, 80, n)) * np.exp(-t / 0.08)
        blip = np.sign(np.sin(2 * np.pi * 1250 * pitch * t)) * np.exp(-t / 0.02) * 0.12
        return thud * 0.8 + blip + bell(hz(93) * pitch, 0.2, 0.5) * 0.12
    raise ValueError(f"unknown sfx {name}")


def build_sfx() -> np.ndarray:
    bus = np.zeros((N + SR * 4, 2))
    for i, cue in enumerate(TL["cues"]):
        s = sfx(cue["sfx"], cue, i)
        s = s / (np.abs(s).max() + 1e-9)
        # Declick: every synthesized sound starts and ends at zero.
        fi, fo = min(len(s), int(0.0015 * SR)), min(len(s), int(0.02 * SR))
        s[:fi] *= np.linspace(0, 1, fi)
        s[len(s) - fo :] *= np.linspace(1, 0, fo)
        p0 = cue.get("pan") or 0.0
        p1 = cue.get("panTo")
        place(bus, pan(s, p0 * 0.8, None if p1 is None else p1 * 0.8), cue["at"], cue.get("gain", 1.0))
    room = reverb_ir(1.8, 0.45, "sfx-room", 6500)
    return reverb(bus, room, 0.3)[:N]


# ---------------------------------------------------------------- voice


def build_voice() -> np.ndarray:
    meter = pyln.Meter(SR)
    bus = np.zeros(N)
    for line in TL["voice"]:
        x, sr = sf.read(ROOT / "public/audio/vo" / f"{line['id']}.flac", dtype="float64")
        # Insert a real breath after the brand without resynthesizing the voice.
        # Work backwards so source-relative offsets remain stable.
        for pause in reversed(line.get("pauses", [])):
            cut = int(round(pause["at"] * sr))
            if not 0 < cut < len(x):
                raise ValueError(f"Pause outside VO source: {line['id']}")
            fade = min(max(1, round(sr * 0.003)), cut, len(x) - cut)
            before, after = x[:cut].copy(), x[cut:].copy()
            before[-fade:] *= np.linspace(1, 0, fade)
            after[:fade] *= np.linspace(0, 1, fade)
            x = np.concatenate([before, np.zeros(round(pause["duration"] * sr)), after])
        x = resample_poly(x, SR // 1000, sr // 1000)
        x = filt(x, "highpass", 85)
        # Gentle compression: RMS-ish envelope, 3:1 above -24 dBFS.
        env = smooth_env(x, 0.005, 0.08)
        level = 20 * np.log10(env + 1e-9)
        gr = np.where(level > -24, (level + 24) * (1 - 1 / 3), 0)
        x = x * 10 ** (-gr / 20)
        padded = np.concatenate([x, np.zeros(int(0.5 * SR))])
        x = x * 10 ** ((-18 - meter.integrated_loudness(padded)) / 20)
        place_mono(bus, x, line["start"])
    return bus


def place_mono(bus: np.ndarray, x: np.ndarray, t: float) -> None:
    i = int(round(t * SR))
    j = min(len(bus), i + len(x))
    bus[i:j] += x[: j - i]


# ---------------------------------------------------------------- mix


def limiter(x: np.ndarray, ceiling: float = 0.89) -> np.ndarray:
    peak = maximum_filter1d(np.abs(x).max(axis=1), size=int(0.004 * SR))
    g = np.minimum(1, ceiling / (peak + 1e-9))
    # Fast attack is implicit via the max filter; release ~80 ms.
    g = 1 - smooth_env(1 - g, 0.0005, 0.08)
    return np.clip(x * g[:, None], -ceiling, ceiling)


def main() -> None:
    meter = pyln.Meter(SR)
    voice = build_voice()
    music = build_music()["music"]
    effects = build_sfx()

    music *= 10 ** ((-21 - meter.integrated_loudness(music)) / 20)
    effects *= 10 ** ((-22.5 - meter.integrated_loudness(effects)) / 20)
    voice_st = np.stack([voice, voice], axis=1) * 10 ** ((-16 - meter.integrated_loudness(voice)) / 20)

    # Duck the music under the narration (about -6 dB), smooth in/out.
    active = smooth_env(voice, 0.02, 0.35)
    duck = np.clip(active / (np.percentile(active[active > 1e-4], 60) + 1e-9), 0, 1)
    duck = smooth_env(duck, 0.06, 0.45)
    music *= (1 - 0.5 * duck)[:, None]

    mix = music + effects + voice_st
    master = 10 ** ((-15 - meter.integrated_loudness(mix)) / 20)
    music, effects, voice_st = music * master, effects * master, voice_st * master
    mix = limiter(mix * master)

    stems = ROOT / "out/audio/stems"
    stems.mkdir(parents=True, exist_ok=True)
    sf.write(stems / "music.wav", music, SR, subtype="PCM_24")
    sf.write(stems / "sfx.wav", effects, SR, subtype="PCM_24")
    sf.write(stems / "voice.wav", voice_st, SR, subtype="PCM_24")
    sf.write(ROOT / "public/audio/mix.wav", mix, SR, subtype="PCM_16")
    print(
        f"mix {len(mix) / SR:.2f}s  integrated {meter.integrated_loudness(mix):.1f} LUFS  "
        f"peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS  beat {BEAT:.4f}s ({60 / BEAT:.2f} BPM)"
    )


if __name__ == "__main__":
    main()
