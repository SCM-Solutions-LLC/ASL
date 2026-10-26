import type { Layout } from "../../layout";
import { STAGE } from "../../layout";
import { PD_SCALE } from "../../chars/pd";
import type { Key } from "../../rig/types";
import type { Beats } from "./beats";

// Choreography for the Holbein look. The painted cut-outs have different joints from the
// illustrated rigs — a body rather than a torso, no upper arms, a face that can only be swapped
// whole — so this is a separate reading of the same beats, not a translation of the other one.
const SH = PD_SCALE.henry;
const SA = PD_SCALE.anne;

export const holbeinKeys = (F: Beats) => ({
  henry: (L: Layout): Key[] => {
    const off = (L.left - 220 - L.marks.henry) / SH;
    return [
      { f: 0, pose: { body: { x: off } } },
      { f: F.henry - 10, pose: { body: { x: off, r: 0 } }, ease: "hold" },
      { f: F.henry - 4, pose: { body: { x: -160, r: 9 } }, ease: "in" },
      { f: F.henry + 6, pose: { body: { x: 0, r: 0 } }, ease: "back" },
      // double take on "once": rock back, jaw drops
      { f: F.once, pose: { head: { r: 5 } }, ease: "out" },
      { f: F.once + 5, pose: { body: { r: -6 }, head: { r: -9 }, jaw: { y: 14 }, foreL: { r: -45 }, foreR: { r: -35 } }, ease: "back" },
      // "wanted out": turned away (flip), points back at her over his shoulder
      { f: F.wanted, pose: { body: { r: 0 }, head: { r: 0 }, jaw: { y: 0 }, foreL: { r: 0 }, foreR: { r: 0 } }, ease: "out" },
      { f: F.wanted + 8, pose: { foreL: { r: 130 }, head: { r: -6 } }, ease: "back" },
      { f: F.annulled - 12, pose: { foreL: { r: 0 }, head: { r: 0 } } },
      { f: F.annulled + 2, pose: { head: { r: 8 } }, ease: "out" },
      { f: F.annulled + 9, pose: { head: { r: 0 } } },
      // turns back as she leaves with the loot
      { f: F.palace + 2, pose: { head: { r: 6 }, jaw: { y: 6 } }, ease: "back" },
      { f: F.castle + 2, pose: { head: { r: -5 }, jaw: { y: 0 } }, ease: "back" },
      // jaw hits the floor on the title
      { f: F.kings + 2, pose: { jaw: { y: 0 }, body: { sy: 1 } }, ease: "hold" },
      { f: F.kings + 8, pose: { jaw: { y: 26 }, head: { r: 0 }, body: { sy: 0.97 } }, ease: "back" },
    ];
  },

  anne: (L: Layout): Key[] => {
    const centre = (STAGE.w / 2 - L.marks.anne) / SA;
    const hop = (f: number, h = 140): Key[] => [
      { f, pose: { skirt: { sy: 0.94, y: 0 } }, ease: "out" },
      { f: f + 5, pose: { skirt: { sy: 1.03, y: -h } }, ease: "out" },
      { f: f + 11, pose: { skirt: { sy: 1, y: 0 } }, ease: "in" },
    ];
    return [
      { f: 0, pose: { skirt: { x: centre, sy: 0.9 }, head: { r: -4 } } },
      { f: 6, pose: { skirt: { x: centre, sy: 1 } }, ease: "back" },
      // smug chin-up on "beat them all"
      { f: F.all, pose: { head: { r: 7 } }, ease: "back" },
      // little bob at her name
      { f: F.wife4 + 22, pose: { body: { y: 30 }, head: { r: -5 } } },
      { f: F.wife4 + 34, pose: { body: { y: 0 }, head: { r: 0 } } },
      // moves to her mark to make room for Henry
      { f: F.henry - 8, pose: { skirt: { x: centre } }, ease: "hold" },
      { f: F.henry + 8, pose: { skirt: { x: 0 } } },
      // unimpressed while he storms off
      { f: F.wanted + 4, pose: { head: { r: -8, v: "closed" } }, ease: "out" },
      { f: F.wanted + 16, pose: { head: { r: -8, v: "default" } }, ease: "hold" },
      { f: F.annulled - 1, pose: { head: { r: 0 } } },
      // walks off with her settlement: a hop per prize, a twirl for the title
      { f: F.walked, pose: { skirt: { x: 0 } } },
      { f: F.palace - 2, pose: { skirt: { x: -110 } }, ease: "linear" },
      ...hop(F.palace),
      ...hop(F.castle),
      { f: F.kings - 2, pose: { skirt: { sx: 1 } } },
      { f: F.kings + 5, pose: { skirt: { sx: -1 } }, ease: "inOut" },
      { f: F.kings + 12, pose: { skirt: { sx: 1 } }, ease: "inOut" },
      { f: F.voEnd + 4, pose: { head: { r: 6, v: "wink" } }, ease: "back" },
    ];
  },
});
