import { Easing, interpolate } from "remotion";
import alignment from "../../generated/six-wives.alignment.json";
import { makeEdit } from "../../edit";
import type { Short } from "../types";
import { beats } from "./beats";
import { bustAnne, bustHenry, drawnAnne, drawnHenry, paintedAnne, paintedHenry } from "../../chars/actors";
import { holbeinKeys } from "./holbein-keys";
import { illustratedKeys } from "./illustrated-keys";
import { portraitKeys } from "./portrait-keys";
import { DrawnHall, framed, Hung, PaintedHall, PaperCutout, PortraitGallery } from "./sets";
import { props, ui } from "./ui";

const edit = makeEdit({
  alignment,
  // The hook, then the Anne of Cleves beat.
  cut: [
    { from: "The fourth wife", to: "beat them all.", tail: 0.21 },
    { from: "Wife four", to: "beloved sister.", tail: 0.08 },
  ],
  keyPhrases: [["fourth"], ["anne", "of", "cleves"], ["annulled"], ["palace"], ["castle"], ["king's", "beloved", "sister"]],
  breakAfter: ["annulled", "palace"],
});

const F = beats(edit);
const drawn = illustratedKeys(F);
const painted = holbeinKeys(F);
const portrait = portraitKeys(F);

// She walks off with the settlement; a bob per step while she is crossing.
const walkBob = (scale: number) => (f: number) =>
  f > F.walked && f < F.palace ? -Math.abs(Math.sin((f - F.walked) / 3.2)) * scale : 0;

export const anneOfCleves: Short = {
  slug: "anne-of-cleves",
  title: "Anne of Cleves",
  edit,
  looks: [
    {
      id: "Illustrated",
      Set: DrawnHall,
      cast: (L) => [
        {
          actor: drawnHenry,
          mark: L.marks.left,
          keys: drawn.henry(L),
          flip: (f) => f >= F.wanted && f < F.walked + 8,
        },
        {
          actor: drawnAnne,
          mark: L.marks.right,
          keys: drawn.anne(L),
          extra: (f) => ({ torso: { y: walkBob(12)(f) } }),
        },
      ],
    },
    {
      id: "Holbein",
      Set: PaintedHall,
      Figures: PaperCutout,
      cast: (L) => [
        {
          actor: paintedHenry,
          mark: L.marks.left,
          keys: painted.henry(L),
          flip: (f) => f >= F.wanted && f < F.walked + 8,
        },
        {
          actor: paintedAnne,
          mark: L.marks.right,
          keys: painted.anne(L),
          extra: (f) => ({ skirt: { y: walkBob(40)(f) } }),
        },
      ],
    },
    {
      id: "Portrait",
      Set: PortraitGallery,
      Figures: Hung,
      cast: () => [
        { actor: bustHenry, mark: 742, keys: portrait.henry(), frame: framed(560, 214, 364, 470) },
        { actor: bustAnne, mark: 1155, keys: portrait.anne(), frame: framed(962, 300, 386, 430) },
      ],
    },
  ],
  props: props(F),
  ui: ui(F),
  camera: {
    zoom: (f) => interpolate(f, [0, F.voEnd], [1, 1.07], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) }),
    // The gavel lands on "annulled".
    shake: (f) => (f >= F.annulled && f < F.annulled + 9 ? Math.sin(f * 2.7) * 12 * (1 - (f - F.annulled) / 9) : 0),
  },
  sfx: [
    { at: F.fourth, name: "pop" },
    { at: F.wife4 - 2, name: "whoosh", volume: 0.35 },
    { at: F.henry - 10, name: "whoosh" },
    { at: F.annulled, name: "thud", volume: 0.7 },
    { at: F.palace, name: "pop" },
    { at: F.castle, name: "pop" },
    { at: F.kings - 6, name: "sparkle", volume: 0.4 },
  ],
};
