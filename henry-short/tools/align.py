"""Turn a script and a VO render into the word timings the edit keys its beats to.

Timings are absolute against one specific render of the VO, so they are generated and never
hand-edited: regenerate the VO and these must be regenerated too, or every beat drifts. The
output records the VO's SHA-256 so `npm run lint` can refuse an edit built on stale timings.

Run (from the project root, needs `requests` for --align):
  python3 -I tools/align.py --align                     # align public/vo.wav via the ElevenLabs API
  python3 -I tools/align.py --from-words response.json  # convert a saved alignment response instead
"""
import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

SCRIPT = Path("script/anne-of-cleves.txt")
AUDIO = Path("public/vo.wav")
OUT = Path("src/generated/alignment.json")

# GA endpoint. The commercial licence on paid plans carves out Beta Services, so the VO itself
# must come from a GA model too — see docs/vo-licensing.md.
API = "https://api.elevenlabs.io/v1/forced-alignment"


def clean(token):
    return re.sub(r"[^a-z0-9']", "", token.lower())


def tokens(text):
    return [t for t in (clean(w) for w in text.split()) if t]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def align_via_api(audio, text):
    """Forced-alignment: the script is given, so the API only has to place it in time."""
    import requests

    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set. Export it, or pass --from-words with a saved response.")
    with audio.open("rb") as f:
        r = requests.post(API, headers={"xi-api-key": key}, files={"file": (audio.name, f)}, data={"text": text}, timeout=300)
    if not r.ok:
        sys.exit(f"{API} returned {r.status_code}: {r.text[:400]}")
    return r.json()


def words_from(payload):
    """Accept either a forced-alignment or a speech-to-text response; keep only spoken words."""
    words = payload["words"] if isinstance(payload, dict) else payload
    return [
        {"text": w["text"], "start": round(float(w["start"]), 3), "end": round(float(w["end"]), 3)}
        for w in words
        if w.get("type", "word") == "word" and clean(w["text"])
    ]


def check_against_script(words, text):
    """A VO read from a different script would silently move every beat; fail loudly instead."""
    got, want = [clean(w["text"]) for w in words], tokens(text)
    if got == want:
        return
    first = next((i for i, (a, b) in enumerate(zip(got, want)) if a != b), min(len(got), len(want)))
    sys.exit(
        f"The timings do not match {SCRIPT}: {len(got)} words aligned, {len(want)} in the script, "
        f"first difference at word {first + 1} ({got[first:first + 4]} vs {want[first:first + 4]}). "
        "Update the script to what was actually spoken, or re-align the right audio."
    )


def main():
    p = argparse.ArgumentParser(description=__doc__)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--align", action="store_true", help="align the VO through the ElevenLabs API")
    src.add_argument("--from-words", type=Path, metavar="FILE", help="use a saved alignment/STT response")
    args = p.parse_args()

    text = SCRIPT.read_text()
    payload = align_via_api(AUDIO, text) if args.align else json.loads(args.from_words.read_text())
    words = words_from(payload)
    check_against_script(words, text)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "generated_by": "tools/align.py",
                "script": str(SCRIPT),
                "audio": str(AUDIO),
                "sha256": sha256(AUDIO),
                "words": words,
            },
            indent=1,
        )
        + "\n"
    )
    print(f"{OUT}: {len(words)} words, {words[-1]['end']:.2f}s, {AUDIO} sha256 {sha256(AUDIO)[:12]}")


if __name__ == "__main__":
    main()
