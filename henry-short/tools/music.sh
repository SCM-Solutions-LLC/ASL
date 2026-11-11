#!/usr/bin/env bash
# Rebuilds public/music/ from the CC0 originals: one bed per category, plus a bed picked for one
# short where the topic calls for its own sound.
#
#   npm run music
#
# Each bed is the first 45 s of its source, levelled to the voice-over's loudness (-26 LUFS) so
# that one volume in src/Scene.tsx sits every bed the same distance under the read. The sources
# and their licences are declared in public/SOURCES.json; change a URL here and change it there.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p public/music

bed() { # name, source URL, and the file to take out of it when the source is a zip
  curl -fsSL --max-time 180 -o "$tmp/$1" "$2"
  if [ -n "${3:-}" ]; then unzip -p "$tmp/$1" "$3" > "$tmp/$1.member" && mv "$tmp/$1.member" "$tmp/$1"; fi
  ffmpeg -v error -y -i "$tmp/$1" -t 45 -af "loudnorm=I=-26:TP=-3:LRA=11" -ar 44100 -ac 2 \
    -map_metadata -1 -fflags +bitexact -flags:a +bitexact -c:a libmp3lame -b:a 128k "public/music/$1.mp3"
}

bed space   "https://opengameart.org/sites/default/files/Out%20in%20Space_0.ogg"
bed geology "https://opengameart.org/sites/default/files/song18_0.mp3"
bed science "https://opengameart.org/sites/default/files/The%20Cogs.mp3"
bed history "https://opengameart.org/sites/default/files/Exploration_0.mp3"
bed egypt   "https://opengameart.org/sites/default/files/Desert_Mystic%20By%20Polygondan.zip" "Desert Mystic2.mp3"
