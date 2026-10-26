import { useVideoConfig } from "remotion";

// Scenes are staged once on a wide set (stage units, 1920 wide, floor at 880).
// Each output format is just a different camera framing of that set, plus its own UI placement.
export const STAGE = { w: 1920, h: 1080, floor: 880 };
export const CHAR_SCALE = 0.62;

export type Layout = {
  vertical: boolean;
  zoom: number; // stage units → output px
  center: [number, number]; // stage point shown at the middle of the frame
  left: number; // left edge of the visible stage, for off-screen entrances
  marks: { henry: number; anne: number }; // where each character stands (stage x)
  prizes: { palace: [number, number]; castle: [number, number] };
  ui: { top: number; scale: number }; // title cards and banners
  stampTop: number;
  captions: { top: number; fontSize: number; maxWidth: number };
};

// 1080×1920: a ~885-unit-wide slice of the set; the set must extend above and below the 16:9 area.
const VERTICAL: Layout = {
  vertical: true,
  zoom: 1.22,
  center: [960, 577],
  left: 960 - 540 / 1.22,
  marks: { henry: 760, anne: 1180 },
  prizes: { palace: [1240, 190], castle: [1000, 170] },
  ui: { top: 150, scale: 1 },
  stampTop: 700,
  captions: { top: 1480, fontSize: 72, maxWidth: 940 },
};

// 1920×1080: the whole set, characters spread wider, captions on one line at the bottom.
const WIDE: Layout = {
  vertical: false,
  zoom: 1,
  center: [960, 540],
  left: 0,
  marks: { henry: 640, anne: 1300 },
  prizes: { palace: [1620, 330], castle: [960, 340] },
  ui: { top: 40, scale: 0.8 },
  stampTop: 330,
  captions: { top: 955, fontSize: 54, maxWidth: 1600 },
};

export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return height > width ? VERTICAL : WIDE;
};
