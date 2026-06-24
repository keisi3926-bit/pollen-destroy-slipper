"""Generate original sound effects for Pollen Destroy Slipper."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44_100
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "assets" / "audio" / "se"
TAU = math.tau
RNG = random.Random(3926)


def clamp(value: float, low: float = -1.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def envelope(t: float, duration: float, attack: float = 0.01, release: float = 0.08) -> float:
    attack_gain = min(1.0, t / max(attack, 1e-6))
    release_gain = min(1.0, (duration - t) / max(release, 1e-6))
    return max(0.0, min(attack_gain, release_gain))


def sine(freq: float, t: float, phase: float = 0.0) -> float:
    return math.sin(TAU * freq * t + phase)


def chirp(start: float, end: float, t: float, duration: float) -> float:
    ratio = min(1.0, max(0.0, t / max(duration, 1e-6)))
    freq = start + (end - start) * ratio
    return sine(freq, t)


def noise() -> float:
    return RNG.uniform(-1.0, 1.0)


def sparkle(t: float, density: float = 22.0) -> float:
    gate = 1.0 if math.sin(TAU * density * t) > 0.72 else 0.0
    return gate * (0.65 * sine(1800 + 420 * math.sin(TAU * 3 * t), t) + 0.18 * noise())


def render(name: str, duration: float, generator, peak: float = 0.72) -> None:
    frame_count = max(1, round(duration * SAMPLE_RATE))
    samples = []
    for index in range(frame_count):
        t = index / SAMPLE_RATE
        value = generator(t, duration) * envelope(t, duration)
        samples.append(value)

    maximum = max(1e-9, max(abs(value) for value in samples))
    gain = peak / maximum
    pcm = b"".join(struct.pack("<h", round(clamp(value * gain) * 32767)) for value in samples)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT_DIR / name), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(pcm)


def generate_all() -> None:
    render(
        "item_p_small.wav",
        0.16,
        lambda t, d: 0.8 * chirp(940, 1380, t, d) + 0.25 * sine(1880, t),
    )
    render(
        "item_p_large.wav",
        0.34,
        lambda t, d: (
            0.65 * chirp(620, 1050, t, d)
            + (0.55 * chirp(950, 1660, t - 0.13, d - 0.13) if t > 0.13 else 0)
            + 0.16 * sparkle(t)
        ),
    )
    render(
        "power_up.wav",
        0.58,
        lambda t, d: 0.65 * chirp(260, 1420, t, d) + 0.24 * chirp(520, 2200, t, d) + 0.15 * sparkle(t),
    )
    render(
        "power_max.wav",
        0.9,
        lambda t, d: (
            0.45 * chirp(180, 1260, t, d * 0.75)
            + 0.32 * sine(82 - 38 * min(1, t / 0.25), t) * math.exp(-7 * t)
            + 0.25 * sparkle(t, 30)
        ),
        peak=0.76,
    )
    render(
        "follower_add.wav",
        0.25,
        lambda t, d: 0.7 * chirp(330, 1100, t, d) + 0.22 * sine(1480, t) * math.exp(-8 * t),
    )
    render(
        "cutin_haou_start.wav",
        0.3,
        lambda t, d: noise() * (0.7 - 0.55 * t / d) + 0.28 * chirp(180, 920, t, d),
    )
    render(
        "cutin_haou_impact.wav",
        0.35,
        lambda t, d: 0.78 * sine(72 - 30 * t / d, t) * math.exp(-9 * t) + 0.32 * noise() * math.exp(-13 * t),
        peak=0.78,
    )
    render(
        "slipper_nova_charge.wav",
        0.95,
        lambda t, d: (
            0.45 * chirp(90, 960, t, d)
            + 0.22 * chirp(220, 2100, t, d)
            + 0.16 * noise() * (t / d)
        ),
    )
    render(
        "slipper_nova_fire.wav",
        1.05,
        lambda t, d: (
            0.48 * sine(62 + 18 * math.sin(TAU * 2 * t), t)
            + 0.34 * noise()
            + 0.2 * sine(1260 + 180 * math.sin(TAU * 5 * t), t)
        )
        * (1.0 - 0.35 * t / d),
        peak=0.74,
    )
    render(
        "slipper_nova_end.wav",
        0.42,
        lambda t, d: 0.58 * chirp(980, 160, t, d) + 0.18 * noise() * (1 - t / d),
    )
    render(
        "cutin_suginomikoto_start.wav",
        0.46,
        lambda t, d: 0.48 * noise() * (1 - t / d) + 0.3 * sparkle(t, 18) + 0.22 * sine(430, t),
    )
    render(
        "divine_bell.wav",
        1.15,
        lambda t, d: (
            0.6 * sine(146, t)
            + 0.32 * sine(292, t, 0.2)
            + 0.2 * sine(511, t, 0.5)
            + 0.12 * sine(803, t)
        )
        * math.exp(-2.8 * t),
        peak=0.74,
    )
    render(
        "pollen_charge.wav",
        0.72,
        lambda t, d: 0.25 * noise() * (t / d) + 0.48 * sparkle(t, 34) + 0.22 * chirp(420, 1320, t, d),
    )
    render(
        "pollen_release.wav",
        0.62,
        lambda t, d: 0.58 * noise() * math.exp(-2.2 * t) + 0.28 * chirp(330, 90, t, d) + 0.18 * sparkle(t),
    )
    render(
        "infinite_scatter.wav",
        1.25,
        lambda t, d: (
            0.48 * sine(54 + 8 * math.sin(TAU * 1.5 * t), t)
            + 0.25 * noise()
            + 0.25 * sparkle(t, 38)
            + 0.18 * chirp(190, 760, t, d)
        ),
        peak=0.76,
    )
    render(
        "player_hit.wav",
        0.24,
        lambda t, d: 0.62 * noise() * math.exp(-14 * t) + 0.48 * chirp(680, 110, t, d),
        peak=0.74,
    )
    render(
        "menu_move.wav",
        0.11,
        lambda t, d: 0.72 * sine(680, t) + 0.2 * sine(1020, t),
        peak=0.56,
    )
    render(
        "menu_decide.wav",
        0.22,
        lambda t, d: 0.62 * chirp(520, 1040, t, d) + 0.24 * sine(1320, t),
        peak=0.62,
    )
    render(
        "menu_cancel.wav",
        0.2,
        lambda t, d: 0.68 * chirp(620, 280, t, d) + 0.18 * sine(190, t),
        peak=0.58,
    )


if __name__ == "__main__":
    generate_all()
    print(f"Generated 19 sound effects in {OUTPUT_DIR}")
