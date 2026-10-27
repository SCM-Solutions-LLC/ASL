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
  marks: { left: number; right: number }; // the two standing positions on the set (stage x)
  ui: { top: number; scale: number }; // title cards and banners
  // The stamp crosses the figures, so its band has to miss their faces in both framings, and
  // it has to fit the frame: 'ANNULLED' at the base size is wider than 1080.
  stamp: { top: number; scale: number };
  // 9:16 has a tall empty lower third, so a fixed top keeps the first line at the same height on
  // every page. 16:9 has about 125px under the artwork — barely two lines — so its block hangs
  // from the bottom instead and grows upward only when a page needs the room.
  captions: { anchor: "top" | "bottom"; y: number; fontSize: number; maxWidth: number };
};

// 1080×1920: a ~885-unit-wide slice of the set; the set must extend above and below the 16:9 area.
const VERTICAL: Layout = {
  vertical: true,
  zoom: 1.22,
  center: [960, 577],
  left: 960 - 540 / 1.22,
  marks: { left: 760, right: 1180 },
  ui: { top: 150, scale: 1 },
  stamp: { top: 1010, scale: 0.66 },
  captions: { anchor: "top", y: 1480, fontSize: 72, maxWidth: 940 },
};

// 1920×1080: the whole set, characters spread wider, captions on one line at the bottom.
const WIDE: Layout = {
  vertical: false,
  zoom: 1,
  center: [960, 540],
  left: 0,
  marks: { left: 640, right: 1300 },
  ui: { top: 40, scale: 0.8 },
  stamp: { top: 560, scale: 1 },
  captions: { anchor: "bottom", y: 24, fontSize: 54, maxWidth: 1600 },
};

export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return height > width ? VERTICAL : WIDE;
};
