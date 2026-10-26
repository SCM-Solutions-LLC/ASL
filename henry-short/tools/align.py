"""Turn a script and a VO render into the word timings the edit keys its beats to.

Timings are absolute against one specific render of the VO, so they are generated and never
hand-edited: regenerate the VO and these must be regenerated too, or every beat drifts. The
output records the VO's SHA-256 so `npm run lint` can refuse an edit built on stale timings.

Run (from the project root, needs `requests` for --align):
  python3 -I tools/align.py anne-of-cleves --align                    # align via the ElevenLabs API
  python3 -I tools/align.py anne-of-cleves --from-words response.json # convert a saved response instead

A short's files are found by its slug: script/<slug>.txt, public/vo/<slug>.wav, and the timings
are written to src/generated/<slug>.alignment.json.
"""
import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

def paths(slug):
    return Path(f"script/{slug}.txt"), Path(f"public/vo/{slug}.wav"), Path(f"src/generated/{slug}.alignment.json")

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


def check_against_script(words, text, script):
    """A VO read from a different script would silently move every beat; fail loudly instead."""
    got, want = [clean(w["text"]) for w in words], tokens(text)
    if got == want:
        return
    first = next((i for i, (a, b) in enumerate(zip(got, want)) if a != b), min(len(got), len(want)))
    sys.exit(
        f"The timings do not match {script}: {len(got)} words aligned, {len(want)} in the script, "
        f"first difference at word {first + 1} ({got[first:first + 4]} vs {want[first:first + 4]}). "
        "Update the script to what was actually spoken, or re-align the right audio."
    )


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("slug", help="the short's slug, e.g. anne-of-cleves")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--align", action="store_true", help="align the VO through the ElevenLabs API")
    src.add_argument("--from-words", type=Path, metavar="FILE", help="use a saved alignment/STT response")
    args = p.parse_args()

    script, audio, out = paths(args.slug)
    text = script.read_text()
    payload = align_via_api(audio, text) if args.align else json.loads(args.from_words.read_text())
    words = words_from(payload)
    check_against_script(words, text, script)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(
            {
                "generated_by": "tools/align.py",
                "script": str(script),
                "audio": str(audio),
                "sha256": sha256(audio),
                "words": words,
            },
            indent=1,
        )
        + "\n"
    )
    print(f"{out}: {len(words)} words, {words[-1]['end']:.2f}s, {audio} sha256 {sha256(audio)[:12]}")


if __name__ == "__main__":
    main()
