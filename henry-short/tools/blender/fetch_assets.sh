#!/usr/bin/env bash
# What the Blender scenes read and git does not hold (tools/blender/assets/ is ignored); run this once.
# Texture scans: Poly Haven, CC0 (polyhaven.com/license), 2K JPG, about 59 MB in all.
# Each set is credited in public/SOURCES.json under the clip that uses it (D1): cleopatra-world.mp4
# for the first six, moai-world.mp4 for the last six.
set -euo pipefail
cd "$(dirname "$0")"
for id in aerial_beach_01 dense_sand sandy_gravel_02 sandstone_blocks_05 rock_face_03 rough_linen \
  rock_boulder_dry aerial_grass_rock grass_ground dry_ground_01 stacked_stone_wall concrete; do
  mkdir -p "assets/$id"
  for map in diff nor_gl rough disp; do
    f="assets/$id/${id}_${map}_2k.jpg"
    [ -s "$f" ] || curl -fsSL -A "asset-fetch/1.0" -o "$f" "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/$id/${id}_${map}_2k.jpg"
  done
done
# The MakeHuman system assets (skins, eyes), CC0, 267 MB: tools/blender/make_people.py reads them.
mkdir -p assets/makehuman
zip=assets/makehuman/makehuman_system_assets_cc0.zip
[ -s "$zip" ] || curl -fsSL -A "asset-fetch/1.0" -o "$zip" "https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip"
[ -d assets/makehuman/data/skins ] || unzip -q -o "$zip" -d assets/makehuman/data
du -sh assets
