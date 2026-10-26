import type { Art } from "../../rig/types";

// A figure's kit: what distinguishes one person in the channel from another. Everything here is
// style-free — the same kit renders in every style, so picking a style never means redrawing a cast.
export type Build = "gown" | "doublet";

export type Palette = {
  cloth: string; // the main garment
  trim: string; // panels, cuffs, the stomacher — the second colour that carries the silhouette
  skin: string;
  hair: string;
  metal: string; // crowns, chains, buckles
  drape?: string; // veil or hood fabric behind the head, if the figure has one
};

export type Kit = {
  id: string;
  build: Build;
  palette: Palette;
  headwear: "gable" | "french" | "hood" | "coronet" | "bonnet" | "flatcap" | "none";
  collar: "square" | "fur" | "high" | "none";
  sleeve: "bell" | "puff" | "fitted";
  hair: "parted" | "loose" | "cropped";
  beard: "none" | "full" | "trim";
};

// One filled or stroked path in a part's own box. Styles decide how a shape is rendered;
// the shape itself only says what is where.
export type Shape = {
  d: string;
  /** Painted colour. Omitted draws a line only. */
  fill?: string;
  /** Overrides the style's ink for this path. */
  stroke?: string;
  /** Multiplies the style's stroke weight. 0 removes the outline. */
  width?: number;
  /** Opt out of a style's shading — eye whites and metal read better untouched. */
  flat?: boolean;
};

export type Drawing = Shape[];

// Every box a build can draw. A style must answer for all of them; a build asks only for its own.
export type Slot =
  | "torso"
  | "skirt"
  | "leg"
  | "upper"
  | "fore"
  | "hand"
  | "head"
  | "veil"
  | "headwear"
  | "jaw"
  | "eyes"
  | "brows"
  | "mouth";

export type ShapeCtx = { kit: Kit; w: number; h: number; side?: "L" | "R" };

// A style is a renderer, not a cast: it turns any drawing into art. Adding a look to the channel
// is one of these, and every existing figure gains it for free.
export type Style = {
  id: string;
  label: string;
  ink: string;
  /** Behind the figure in the comparison sheet; not used on a real set. */
  paper: string;
  render: (drawing: Drawing, w: number, h: number, key: string) => Art;
};
