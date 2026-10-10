"""Generate voice-over lines with Kokoro (Apache-2.0) into public/audio/vo/.

Usage (from video/):
  python scripts/audio/voiceover.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin

Model files: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Requires: kokoro-onnx, soundfile, numpy.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "src/audio/voiceover.json"
OUT = ROOT / "public/audio/vo"


def trim(samples: np.ndarray, sr: int, threshold_db: float = -42.0, pad_ms: int = 40) -> np.ndarray:
    """Trim leading/trailing silence so durations reflect actual speech."""
    level = 10 ** (threshold_db / 20)
    window = int(sr * 0.01)
    env = np.convolve(np.abs(samples), np.ones(window) / window, mode="same")
    idx = np.nonzero(env > level)[0]
    if len(idx) == 0:
        return samples
    pad = int(sr * pad_ms / 1000)
    return samples[max(0, idx[0] - pad) : min(len(samples), idx[-1] + pad)]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--voices", required=True)
    parser.add_argument("--voice", help="override voice from voiceover.json")
    parser.add_argument("--only", nargs="*", help="line ids to regenerate")
    args = parser.parse_args()

    script = json.loads(SCRIPT.read_text())
    voice = args.voice or script["voice"]
    kokoro = Kokoro(args.model, args.voices)
    OUT.mkdir(parents=True, exist_ok=True)

    durations = {}
    for line in script["lines"]:
        path = OUT / f"{line['id']}.flac"
        if not args.only or line["id"] in args.only:
            samples, sr = kokoro.create(
                line["text"], voice=voice, speed=line.get("speed", script["speed"]), lang="en-us"
            )
            samples = trim(np.asarray(samples, dtype=np.float32), sr)
            sf.write(path, samples, sr, subtype="PCM_16")
        info = sf.info(path)
        durations[line["id"]] = round(info.frames / info.samplerate, 3)
        print(f"{line['id']:>3} {durations[line['id']]:6.2f}s  {line['text']}")

    (OUT / "durations.json").write_text(json.dumps({"voice": voice, "durations": durations}, indent=2) + "\n")


if __name__ == "__main__":
    main()
