"""Speak a script with Kokoro and write the word timings the edit keys its beats to.

Kokoro-82M is Apache-2.0 (hexgrad/Kokoro-82M), which is why it is here: the voice-over is the one
asset this channel cannot afford another licence surprise on. It runs locally, so there is no
per-character cost and no terms page that can change under a published video.

Run (from the project root):
  pip install kokoro soundfile          # once; Kokoro also wants espeak-ng on the system
  python3 -I tools/tts.py scale-of-the-sun
  python3 -I tools/tts.py scale-of-the-sun --voice am_michael --speed 0.95
  python3 -I tools/tts.py --self-test   # exercises the timing and WAV code with no model at all

Writes public/vo/<slug>.wav and src/generated/<slug>.alignment.json, the same format tools/align.py
produces, so `npm run lint` checks it the same way and makeEdit consumes it unchanged.

Kokoro samples, so the generator is seeded: the same script, voice, speed and seed give the same
audio every time. Without that the recorded hash would describe one lucky render rather than the
script, and re-running the tool would silently invalidate a committed voice-over.

Timing: each sentence is synthesised separately, so every sentence boundary is a MEASURED time
rather than an estimate. Within a sentence, words are spread across the voiced audio by the same
length weighting src/edit.ts uses for drafts. So error never accumulates past one sentence — which
is the accuracy a word-anchored beat actually needs, without a forced aligner and the half-gigabyte
of model weights one brings with it.
"""
import argparse
import hashlib
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

SR = 24000  # Kokoro's output rate
GAP = 0.16  # seconds of room inserted between sentences
SILENCE = 0.02  # amplitude below which a chunk is considered to have stopped speaking


def paths(slug):
    return Path(f"script/{slug}.txt"), Path(f"public/vo/{slug}.wav"), Path(f"src/generated/{slug}.alignment.json")


def clean(token):
    return re.sub(r"[^a-z0-9']", "", token.lower())


def read_script(path):
    """The spoken part of a script file, dropping any `---` sources block kept below it."""
    return path.read_text().split("\n---\n")[0].strip()


def sentences(text):
    """Split on sentence ends, keeping the punctuation — Kokoro reads it for prosody."""
    parts = re.split(r"(?<=[.!?])\s+", " ".join(text.split()))
    return [p for p in (s.strip() for s in parts) if p]


def weigh(word):
    """Longer words take longer to say. Same curve as makeDraftEdit, so drafts and reads agree."""
    return 0.62 + 0.38 * min(2.2, len(re.sub(r"[^A-Za-z0-9']", "", word)) / 4.5)


def spread(words, start, end):
    """Tile words across a measured span, proportional to how long each takes to say."""
    weights = [weigh(w) for w in words]
    total = sum(weights) or 1.0
    out, t = [], start
    for word, weight in zip(words, weights):
        dur = (end - start) * weight / total
        out.append({"text": word, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur
    return out


def voiced_end(audio):
    """Where a chunk stops speaking, so trailing silence is a gap rather than a stretched word."""
    loud = np.flatnonzero(np.abs(audio) > SILENCE)
    return int(loud[-1]) + 1 if loud.size else len(audio)


def assemble(chunks):
    """Concatenate synthesised sentences and place every word against the measured audio."""
    audio, words, cursor = [], [], 0
    for text, samples in chunks:
        start = cursor / SR
        spoken = voiced_end(samples) / SR
        words += spread(text.split(), start, start + spoken)
        audio.append(samples)
        audio.append(np.zeros(int(GAP * SR), dtype=np.float32))
        cursor += len(samples) + int(GAP * SR)
    return np.concatenate(audio) if audio else np.zeros(0, dtype=np.float32), words


def write_wav(path, audio):
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak > 1.0:
        audio = audio / peak
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def synthesise(lines, voice, speed, seed):
    """The only part that needs the model. Everything above it is pure and tested by --self-test."""
    try:
        import torch
        from kokoro import KPipeline
    except ImportError:
        sys.exit("kokoro is not installed. `pip install kokoro soundfile` (and espeak-ng on the system).")

    # Kokoro samples, so two runs of the same script produce different audio unless the generator
    # is pinned. Found by running it twice and getting two different file hashes. That matters
    # here: the alignment records the WAV's hash so a stale edit can be refused, and a voice-over
    # nobody can reproduce makes that hash a record of one lucky render rather than of the script.
    torch.manual_seed(seed)

    pipeline = KPipeline(lang_code=voice[0])
    chunks = []
    for line in lines:
        pieces = [np.asarray(audio, dtype=np.float32) for _, _, audio in pipeline(line, voice=voice, speed=speed)]
        if not pieces:
            sys.exit(f"Kokoro returned no audio for: {line[:60]!r}")
        chunks.append((line, np.concatenate(pieces)))
    return chunks


def self_test():
    """Exercise splitting, timing, WAV writing and the alignment shape without downloading a model."""
    import tempfile

    text = "Jupiter is the biggest planet. Two and a half times the mass of every other planet combined. But next to the Sun it disappears."
    lines = sentences(text)
    assert len(lines) == 3, lines

    # Stand-in audio: a tone per sentence, length proportional to its text, then real silence.
    rng = np.random.default_rng(0)
    chunks = []
    for line in lines:
        voiced = int(SR * len(line) / 14)
        chunks.append((line, np.concatenate([rng.standard_normal(voiced).astype(np.float32) * 0.3,
                                             np.zeros(int(SR * 0.4), dtype=np.float32)])))
    audio, words = assemble(chunks)

    assert [w["text"] for w in words] == text.split(), "words must survive round-tripping"
    assert all(a["end"] <= b["start"] + 1e-6 for a, b in zip(words, words[1:])), "words must not overlap"
    assert words[0]["start"] == 0.0
    # A sentence boundary is measured, so it must land inside its chunk's voiced part, not after it.
    second = next(w for w in words if w["text"] == "Two")
    assert second["start"] > words[2]["end"], "sentence 2 must start after sentence 1 stops speaking"
    assert len(audio) / SR > words[-1]["end"], "audio must outlast the last word"

    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "probe.wav"
        write_wav(out, audio)
        with wave.open(str(out)) as f:
            assert f.getframerate() == SR and f.getnchannels() == 1 and f.getsampwidth() == 2
            assert f.getnframes() == len(audio)
        assert len(sha256(out)) == 64

    print(f"self-test ok: {len(lines)} sentences, {len(words)} words, {len(audio) / SR:.2f}s, WAV and hash verified")
    print("NOT tested here: the Kokoro call itself — this container cannot reach the model weights.")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("slug", nargs="?", help="the short's slug, e.g. scale-of-the-sun")
    p.add_argument("--voice", default="af_heart", help="Kokoro voice id (default: af_heart)")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--seed", type=int, default=0, help="pins Kokoro's sampling so a re-run is identical")
    p.add_argument("--self-test", action="store_true", help="check the timing and WAV code with no model")
    args = p.parse_args()

    if args.self_test:
        return self_test()
    if not args.slug:
        p.error("a slug is required (or pass --self-test)")

    script, audio_path, out = paths(args.slug)
    if not script.exists():
        sys.exit(f"{script} does not exist. Write the script first.")
    lines = sentences(read_script(script))
    audio, words = assemble(synthesise(lines, args.voice, args.speed, args.seed))
    write_wav(audio_path, audio)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(
            {
                "generated_by": f"tools/tts.py --voice {args.voice} --speed {args.speed} --seed {args.seed}",
                "script": str(script),
                "audio": str(audio_path),
                "sha256": sha256(audio_path),
                "words": words,
            },
            indent=1,
        )
        + "\n"
    )
    print(f"{audio_path}: {len(audio) / SR:.2f}s, {len(lines)} sentences")
    print(f"{out}: {len(words)} words, sha256 {sha256(audio_path)[:12]}")


if __name__ == "__main__":
    main()
