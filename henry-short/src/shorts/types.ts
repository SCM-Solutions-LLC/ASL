import type React from "react";
import type { Edit } from "../edit";
import type { Layout } from "../layout";
import type { Actor } from "../rig/cast";
import type { Key, Pose } from "../rig/types";

// One figure on the set for one look: who, where they stand, and what they do.
export type Staged = {
  actor: Actor;
  mark: number; // stage x the figure stands on
  keys: Key[];
  flip?: (f: number) => boolean;
  /** Procedural motion layered on top of the keyed pose, e.g. a walk bob. */
  extra?: (f: number) => Pose;
};

// The same short rendered a different way: its own set, its own figures, its own choreography.
export type Look = {
  id: string; // composition id suffix, e.g. "Holbein"
  Set: React.FC;
  /** Wraps the figures only — the paper cut-out drop shadow, say. */
  Figures?: React.FC<{ children: React.ReactNode }>;
  cast: (L: Layout) => Staged[];
};

export type Short = {
  slug: string;
  title: string;
  edit: Edit;
  looks: Look[];
  /** Drawn inside the camera, in stage units: badges, prizes, props that sit in the scene. */
  props?: (L: Layout) => React.ReactNode;
  /** Drawn over the whole frame, in output px: title cards, stamps, banners. */
  ui?: (L: Layout) => React.ReactNode;
  sfx?: { at: number; name: string; volume?: number }[];
  camera?: { zoom?: (f: number) => number; shake?: (f: number) => number };
  /** Dark gradient behind the captions. On by default. */
  scrim?: boolean;
};
