#!/usr/bin/env bash
# One command from a fresh clone to a working pipeline: Node deps plus the pinned Python 3.12 venv
# the tools run in. Python 3.12, not newer: Kokoro's spaCy dependency does not build on 3.13.
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci
if command -v uv >/dev/null; then
  uv venv --python 3.12 --allow-existing .venv
  uv pip sync --python .venv/bin/python requirements.txt
else
  python3.12 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
.venv/bin/python -I tools/tts.py --self-test
echo "setup ok. Kokoro weights download from huggingface.co on the first \`npm run tts\`."
