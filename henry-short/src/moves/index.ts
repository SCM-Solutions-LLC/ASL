import type { Binder, Expression, Role } from "../rig/cast";
import type { Key } from "../rig/types";

// A gesture, written once against roles and expressions, that any figure can perform. A figure
// without the joints a move wants performs the part of it that it can: the painted cut-outs have
// no upper arms, so a point becomes a forearm swing rather than failing or faking a joint.
//
// Moves return keys, so a short can mix them freely with hand-written keys — they are a shortcut
// for the ordinary case, not the only way to say something.
export type Move<O = void> = (b: Binder, at: number, opts: O) => Key[];

const pick = (b: Binder, ...roles: Role[]): Role | undefined => roles.find((r) => b.has(r));

/** Slide on from off-stage to the mark. `from` is in rig units, negative for stage left. */
export const enter = (b: Binder, at: number, { from, over = 14 }: { from: number; over?: number }): Key[] => [
  b.key(at, { root: { x: from } }, { ease: "hold" }),
  b.key(at + over, { root: { x: 0 } }, { ease: "out" }),
];

/** Land on the mark with a squash and a pop — a figure appearing for the first time. */
export const settle = (b: Binder, at: number, { squash = 0.92 }: { squash?: number } = {}): Key[] => [
  b.key(at, { root: { sy: squash } }),
  b.key(at + 6, { root: { sy: 1 } }, { ease: "back" }),
];

/** A curtsy or a bow: dip, tilt, come back up. */
export const bob = (b: Binder, at: number, { dip = 16, tilt = -6, over = 12 }: { dip?: number; tilt?: number; over?: number } = {}): Key[] => {
  const part = pick(b, "body", "root")!;
  return [
    b.key(at, { [part]: { y: dip }, head: { r: tilt } }),
    b.key(at + over, { [part]: { y: 0 }, head: { r: 0 } }),
  ];
};

/** Glance across, then recoil: the standard "wait, what?" beat. */
export const doubleTake = (b: Binder, at: number, { lean = -7 }: { lean?: number } = {}): Key[] => [
  b.key(at, { head: { r: 4 } }, { face: "glance", ease: "out" }),
  b.key(
    at + 5,
    { root: { r: lean }, head: { r: -6 }, armL: { r: 34 }, armR: { r: -34 }, foreL: { r: -50 }, foreR: { r: 50 }, jaw: { y: 14 } },
    { face: "shocked", ease: "back" },
  ),
  b.rest(at + 18, { root: { r: 0 }, head: { r: 0 }, jaw: { y: 0 } }, { ease: "out" }),
];

/** The jaw hits the floor, and the figure sinks a little under the news. */
export const jawDrop = (b: Binder, at: number, { drop = 24 }: { drop?: number } = {}): Key[] => [
  b.key(at, { jaw: { y: 0 }, root: { sy: 1 } }, { ease: "hold" }),
  b.key(at + 6, { jaw: { y: drop }, root: { sy: 0.96 }, head: { r: 0 } }, { face: "shocked", ease: "back" }),
];

/** Throw an arm out to point. Falls back to the forearm alone on a figure with no upper arms. */
export const point = (b: Binder, at: number, { side = "L", hold = 20 }: { side?: "L" | "R"; hold?: number } = {}): Key[] => {
  const up = (side === "L" ? "armL" : "armR") as Role;
  const fore = (side === "L" ? "foreL" : "foreR") as Role;
  const hand = (side === "L" ? "handL" : "handR") as Role;
  const dir = side === "L" ? 1 : -1;
  const out = b.has(up) ? { [up]: { r: 105 * dir }, [fore]: { r: -30 * dir }, [hand]: { v: "point" } } : { [fore]: { r: 130 * dir } };
  return [
    b.key(at + 8, { ...out, head: { r: -5 * dir } }, { ease: "back" }),
    b.rest(at + 8 + hold, { [hand]: { v: "default" }, head: { r: 0 } }),
  ];
};

/** Unimpressed: eyes away and back, without moving anything else. */
export const eyeRoll = (b: Binder, at: number, { over = 12 }: { over?: number } = {}): Key[] => [
  b.key(at, {}, { face: "unimpressed", ease: "hold" }),
  b.key(at + over, {}, { face: "neutral", ease: "hold" }),
];

/** Back to the neutral face and the figure's own rest pose. */
export const relax = (b: Binder, at: number, { ease = "out" }: { ease?: Key["ease"] } = {}): Key[] => [b.rest(at, {}, { ease })];

/** Head rocks on an impact — a gavel, a door, a thud. */
export const knock = (b: Binder, at: number, { deg = 7, over = 7 }: { deg?: number; over?: number } = {}): Key[] => [
  b.key(at, { head: { r: deg } }, { ease: "out" }),
  b.key(at + over, { head: { r: 0 } }),
];

/** Arms up, delighted. Degrades to a head tilt on a figure with no arms. */
export const cheer = (b: Binder, at: number, { spread = 158 }: { spread?: number } = {}): Key[] =>
  b.has("armL")
    ? [b.key(at, { armL: { r: spread }, armR: { r: -spread }, foreL: { r: 0 }, foreR: { r: 0 } }, { face: "delighted", ease: "back" })]
    : [b.key(at, { head: { r: -6 } }, { face: "delighted", ease: "back" })];

/** A jump on the spot, squashing on take-off and landing. */
export const hop = (b: Binder, at: number, { height = 100 }: { height?: number } = {}): Key[] => [
  b.key(at, { root: { sy: 0.94, y: 0 } }, { ease: "out" }),
  b.key(at + 5, { root: { sy: 1.03, y: -height } }, { ease: "out" }),
  b.key(at + 11, { root: { sy: 1, y: 0 } }, { ease: "in" }),
];

/** Spin on the spot by flipping horizontally through the turn. */
export const twirl = (b: Binder, at: number, { over = 14 }: { over?: number } = {}): Key[] => [
  b.key(at, { root: { sx: 1 } }),
  b.key(at + Math.round(over / 2), { root: { sx: -1 } }, { ease: "inOut" }),
  b.key(at + over, { root: { sx: 1 } }, { ease: "inOut" }),
];

/** Cross the stage. The step bob is procedural — see `Staged.extra` — this is just the travel. */
export const walk = (b: Binder, at: number, { to, over }: { to: number; over: number }): Key[] => [
  b.key(at, { root: {} }, { ease: "hold" }),
  b.key(at + over, { root: { x: to } }, { ease: "linear" }),
];

/** Hold a face for a while, then drop it. */
export const face = (b: Binder, at: number, { show, until }: { show: Expression; until?: number }): Key[] => [
  b.key(at, {}, { face: show, ease: "hold" }),
  ...(until === undefined ? [] : [b.key(until, {}, { face: "neutral", ease: "hold" })]),
];
