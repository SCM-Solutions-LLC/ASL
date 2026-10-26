import type { Layout } from "../../layout";
import { CHAR_SCALE as S, STAGE } from "../../layout";
import { anneHipsHands, anneRest } from "../../chars/anne";
import { henryRest } from "../../chars/henry";
import type { Key } from "../../rig/types";
import type { Beats } from "./beats";

// Choreography for the illustrated look, as hand-authored when this short was cut. Kept verbatim
// rather than rebuilt on src/moves: the pose numbers are tuned to these two figures, and nothing
// is gained by making a finished short re-derive them.
export const illustratedKeys = (F: Beats) => ({
  henry: (L: Layout): Key[] => {
    const off = (L.left - 260 - L.marks.left) / S;
    return [
      { f: 0, pose: { ...henryRest, torso: { x: off } } },
      { f: F.henry - 10, pose: { torso: { x: off, r: 0 } }, ease: "hold" },
      { f: F.henry - 4, pose: { torso: { x: -120, r: 10 } }, ease: "in" },
      { f: F.henry + 6, pose: { torso: { x: 0, r: 0 } }, ease: "back" },
      // double take on "once"
      { f: F.once, pose: { eyes: { v: "side" }, head: { r: 4 } }, ease: "out" },
      { f: F.once + 5, pose: { eyes: { v: "wide" }, brows: { v: "raised" }, mouth: { v: "open" }, torso: { r: -7 }, head: { r: -6 }, upperL: { r: 34 }, upperR: { r: -34 }, foreL: { r: -50 }, foreR: { r: 50 } }, ease: "back" },
      // "wanted out": turned away (flip), jerks a thumb back at her
      { f: F.wanted, pose: { eyes: { v: "default" }, brows: { v: "angry" }, mouth: { v: "frown" }, torso: { r: 0 }, head: { r: 0 }, ...henryRest }, ease: "out" },
      { f: F.wanted + 8, pose: { upperL: { r: 105 }, foreL: { r: -30 }, handL: { v: "point" }, head: { r: -5 } }, ease: "back" },
      { f: F.annulled - 12, pose: { ...henryRest, handL: { v: "default" }, head: { r: 0 } } },
      { f: F.annulled + 2, pose: { head: { r: 7 } }, ease: "out" },
      { f: F.annulled + 9, pose: { head: { r: 0 } } },
      // turns back to watch her leave with the loot
      { f: F.walked + 8, pose: { eyes: { v: "side" }, brows: { v: "default" }, mouth: { v: "default" } }, ease: "hold" },
      { f: F.palace + 2, pose: { head: { r: 5 }, brows: { v: "raised" } }, ease: "back" },
      { f: F.castle + 2, pose: { head: { r: -4 } }, ease: "back" },
      // jaw drop on the title
      { f: F.kings + 2, pose: { eyes: { v: "wide" }, mouth: { v: "open" }, jaw: { y: 0 }, torso: { sy: 1 } }, ease: "hold" },
      { f: F.kings + 8, pose: { jaw: { y: 24 }, head: { r: 0 }, torso: { sy: 0.96 } }, ease: "back" },
    ];
  },

  anne: (L: Layout): Key[] => {
    const centre = (STAGE.w / 2 - L.marks.right) / S;
    return [
      { f: 0, pose: { ...anneRest, torso: { x: centre, sy: 0.92 }, brows: { v: "smug" } } },
      { f: 6, pose: { torso: { x: centre, sy: 1 } }, ease: "back" },
      { f: F.all + 2, pose: anneHipsHands, ease: "back" },
      // little curtsy at her name
      { f: F.wife4 + 22, pose: { torso: { x: centre, y: 16 }, head: { r: -6 } } },
      { f: F.wife4 + 34, pose: { torso: { x: centre, y: 0 }, head: { r: 0 } } },
      // moves to her mark to make room for Henry
      { f: F.henry - 8, pose: { torso: { x: centre } }, ease: "hold" },
      { f: F.henry + 8, pose: { torso: { x: 0 } } },
      // unimpressed eye-roll while he storms off
      { f: F.wanted + 4, pose: { brows: { v: "raised" }, mouth: { v: "default" }, eyes: { v: "side" } }, ease: "hold" },
      { f: F.wanted + 16, pose: { eyes: { v: "default" } }, ease: "hold" },
      { f: F.annulled + 3, pose: { torso: { x: 0, y: -12 }, mouth: { v: "smirk" }, brows: { v: "smug" } }, ease: "out" },
      { f: F.annulled + 11, pose: { torso: { x: 0, y: 0 } } },
      // walks off with her settlement
      { f: F.walked, pose: { torso: { x: 0 } } },
      { f: F.palace - 2, pose: { torso: { x: -40 } }, ease: "linear" },
      { f: F.palace, pose: { upperR: { r: -140 }, foreR: { r: -20 } }, ease: "back" },
      { f: F.castle, pose: { upperL: { r: 140 }, foreL: { r: 20 } }, ease: "back" },
      { f: F.kings, pose: { upperL: { r: 158 }, foreL: { r: 0 }, upperR: { r: -158 }, foreR: { r: 0 }, mouth: { v: "smile" }, eyes: { v: "closed" } }, ease: "back" },
      { f: F.sister, pose: {}, ease: "hold" },
      { f: F.sister + 10, pose: { ...anneHipsHands, mouth: { v: "smirk" }, eyes: { v: "default" } }, ease: "back" },
      { f: F.voEnd + 6, pose: { eyes: { v: "wink" }, head: { r: 6 } }, ease: "back" },
    ];
  },
});
