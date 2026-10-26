import type { Key } from "../../rig/types";
import type { Beats } from "./beats";

// Choreography for the bust framing. Held this close there is nowhere to walk to and no hem to
// swing, so the beats land on what a painted face can actually do: turn, lean, drop a jaw, shut an
// eye. Entrances and exits are drifts and pushes rather than crossings.
// Jaw travel is small here on purpose: the paint revealed behind a dropped jaw was judged at
// full-length distance, and at bust scale the same numbers read as a black bar across his mouth.
export const portraitKeys = (F: Beats) => ({
  henry: (): Key[] => [
    // Out of frame to the left until his name, then slides in and settles.
    { f: 0, pose: { body: { x: -540, r: 0 } } },
    { f: F.henry - 10, pose: { body: { x: -540 } }, ease: "hold" },
    { f: F.henry + 4, pose: { body: { x: 40, r: 3 } }, ease: "out" },
    { f: F.henry + 14, pose: { body: { x: 0, r: 0 } }, ease: "back" },
    // "once": rocks back, jaw drops, forearms lift into frame
    { f: F.once, pose: { head: { r: 4 } }, ease: "out" },
    { f: F.once + 5, pose: { body: { r: -4 }, head: { r: -8 }, jaw: { y: 6 }, foreL: { r: -38 }, foreR: { r: -30 } }, ease: "back" },
    { f: F.once + 20, pose: { body: { r: 0 }, head: { r: -3 }, jaw: { y: 2 }, foreL: { r: -14 }, foreR: { r: -10 } } },
    // "wanted out": turns away from her
    { f: F.wanted + 6, pose: { head: { r: 9 }, jaw: { y: 0 }, foreL: { r: 0 }, foreR: { r: 0 } }, ease: "back" },
    // the gavel
    { f: F.annulled, pose: { head: { r: 9 }, body: { y: 0 } }, ease: "hold" },
    { f: F.annulled + 4, pose: { head: { r: 0 }, body: { y: 14 } }, ease: "in" },
    { f: F.annulled + 14, pose: { body: { y: 0 } }, ease: "back" },
    // watches the settlement leave
    { f: F.palace + 2, pose: { head: { r: -7 }, jaw: { y: 3 } }, ease: "back" },
    { f: F.castle + 2, pose: { head: { r: -9 }, jaw: { y: 5 } }, ease: "back" },
    // jaw hits the floor on the title
    { f: F.kings + 2, pose: { jaw: { y: 5 } }, ease: "hold" },
    { f: F.kings + 10, pose: { jaw: { y: 11 }, head: { r: -4 } }, ease: "back" },
  ],

  anne: (): Key[] => [
    // Pushes in from slightly back, which is the bust equivalent of walking on.
    { f: 0, pose: { body: { sx: 0.94, sy: 0.94, y: 26 }, head: { r: -3 } } },
    { f: 10, pose: { body: { sx: 1, sy: 1, y: 0 } }, ease: "back" },
    // smug chin-up on "beat them all"
    { f: F.all, pose: { head: { r: 6 } }, ease: "back" },
    { f: F.wife4 + 20, pose: { head: { r: -4 }, body: { y: 12 } } },
    { f: F.wife4 + 32, pose: { head: { r: 0 }, body: { y: 0 } } },
    // turns to watch him arrive, but she is hung on a wall and stays there
    { f: F.henry - 8, pose: { body: { x: 0 } }, ease: "hold" },
    { f: F.henry + 10, pose: { body: { x: -18 }, head: { r: -6 } } },
    // unimpressed while he storms off
    { f: F.wanted + 4, pose: { head: { r: -9, v: "closed" } }, ease: "out" },
    { f: F.wanted + 16, pose: { head: { r: -9, v: "default" } }, ease: "hold" },
    { f: F.annulled - 1, pose: { head: { r: -2 }, body: { x: 0 } } },
    // She takes the settlement and walks out of her own portrait — the one exit a hung figure has.
    { f: F.walked, pose: { body: { x: 0 } }, ease: "hold" },
    { f: F.palace, pose: { body: { x: 54 }, head: { r: 4 } }, ease: "out" },
    { f: F.castle, pose: { body: { x: 118 }, head: { r: 6 } }, ease: "out" },
    { f: F.kings + 8, pose: { body: { x: 470 }, head: { r: 8 } }, ease: "in" },
    { f: F.voEnd - 14, pose: { body: { x: 470 } }, ease: "hold" },
    // and leans back in for the last word
    { f: F.voEnd + 4, pose: { body: { x: 300 }, head: { r: 9, v: "wink" } }, ease: "back" },
  ],
});
