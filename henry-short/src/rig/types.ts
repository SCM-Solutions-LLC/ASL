import type React from "react";

// A part's look. `src` is a PNG/SVG in public/ (the real kit); `node` is inline placeholder art.
export type Art = { src: string } | { node: React.ReactNode };

// One rigid piece of a cut-out character. Coordinates are px in the part's own box.
export type PartDef = {
  id: string;
  w: number;
  h: number;
  pivot: [number, number]; // joint inside this part's box
  at: [number, number]; // where that joint sits in the parent's box (ignored on the root)
  z?: number; // < 0 draws behind the parent, otherwise in front
  art: Record<string, Art>; // variants; "default" unless the pose picks another
  children?: PartDef[];
};

export type PartPose = {
  r?: number; // degrees, clockwise
  x?: number;
  y?: number;
  sx?: number;
  sy?: number;
  v?: string; // art variant
};

export type Pose = Record<string, PartPose>;

export type Ease = "inOut" | "out" | "in" | "back" | "linear" | "hold";

// A key is partial: parts it doesn't mention keep their previous values.
// `ease` shapes the move INTO this key.
export type Key = { f: number; pose: Pose; ease?: Ease };
