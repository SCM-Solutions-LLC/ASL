import { anne, anneRest } from "./anne";
import { henry, henryRest } from "./henry";
import { BUST_SCALE, PD_SCALE, pdAnne, pdAnneBust, pdHenry } from "./pd";
import { CHAR_SCALE as S, STAGE } from "../layout";
import type { Actor } from "../rig/cast";

// Who can appear in a short, and what each figure's joints and faces are called. Actors are
// short-agnostic on purpose: the same Henry walks into whichever short needs him.

// Illustrated figures pose eyes, brows and mouth separately, so each expression is a combination.
export const drawnFaces = {
  neutral: { eyes: { v: "default" }, brows: { v: "default" }, mouth: { v: "default" } },
  shocked: { eyes: { v: "wide" }, brows: { v: "raised" }, mouth: { v: "open" } },
  unimpressed: { eyes: { v: "side" }, brows: { v: "raised" } },
  smug: { brows: { v: "smug" }, mouth: { v: "smirk" } },
  annoyed: { brows: { v: "angry" }, mouth: { v: "frown" } },
  delighted: { eyes: { v: "closed" }, mouth: { v: "smile" } },
  glance: { eyes: { v: "side" } },
  wink: { eyes: { v: "wink" } },
};

export const drawnRoles = {
  root: "torso",
  body: "torso",
  head: "head",
  armL: "upperL",
  armR: "upperR",
  foreL: "foreL",
  foreR: "foreR",
  handL: "handL",
  handR: "handR",
  eyes: "eyes",
} as const;

// Hem height for a gowned figure from chars/figure.tsx, so the skirt lands on the floor.
export const GOWN_FLOOR = STAGE.floor - 562 * S;

// Every figure chars/figure.tsx builds shares these joints and faces, so a new person in the
// channel is a palette and a floor height rather than a new rig.
export const drawnActor = (name: string, def: Actor["def"], rest: Actor["rest"] = {}, floor = GOWN_FLOOR): Actor => ({
  name,
  def,
  scale: S,
  floor,
  roles: drawnRoles,
  faces: drawnFaces,
  rest,
});

export const drawnHenry: Actor = {
  name: "henry",
  def: henry,
  scale: S,
  floor: STAGE.floor - 265 * S, // hip height that puts his feet on the floor
  roles: { ...drawnRoles, jaw: "jaw" },
  faces: drawnFaces,
  rest: henryRest,
};

export const drawnAnne: Actor = {
  name: "anne",
  def: anne,
  scale: S,
  floor: STAGE.floor - 562 * S, // her hem, not her feet
  roles: drawnRoles,
  faces: drawnFaces,
  rest: anneRest,
};

// The painted cut-outs are whole limbs from a portrait: no upper arms, and the only face they have
// is the head the painter gave them, so most expressions simply do not exist on them.
export const paintedHenry: Actor = {
  name: "henry",
  def: pdHenry,
  scale: PD_SCALE.henry,
  floor: STAGE.floor,
  roles: { root: "body", head: "head", jaw: "jaw", foreL: "foreL", foreR: "foreR" },
  faces: {
    neutral: { jaw: { y: 0 }, head: { v: "default" } },
    shocked: { jaw: { y: 22 } },
    delighted: { head: { v: "closed" } },
  },
  rest: {},
};

export const paintedAnne: Actor = {
  name: "anne",
  def: pdAnne,
  scale: PD_SCALE.anne,
  floor: STAGE.floor,
  roles: { root: "skirt", body: "body", head: "head" },
  faces: {
    neutral: { head: { v: "default" } },
    delighted: { head: { v: "closed" } },
    wink: { head: { v: "wink" } },
  },
  rest: {},
};

// ---------------------------------------------------------------- bust framing

// Held chest-up, the painted figures stop pretending to be whole bodies: no floor to stand on, no
// gown to invent. What they can still do — turn a head, drop a jaw, close an eye — is exactly what
// reads at this distance, so the method's weakness stops mattering.
export const bustHenry: Actor = {
  name: "henry",
  def: pdHenry,
  scale: BUST_SCALE.henry,
  floor: 978, // his feet, far below the frame
  roles: { root: "body", head: "head", jaw: "jaw", foreL: "foreL", foreR: "foreR" },
  faces: {
    neutral: { jaw: { y: 0 }, head: { v: "default" } },
    shocked: { jaw: { y: 22 } },
    delighted: { head: { v: "closed" } },
  },
  rest: {},
};

export const bustAnne: Actor = {
  name: "anne",
  def: pdAnneBust,
  scale: BUST_SCALE.anne,
  floor: 1148, // her waist, where the painting ends
  roles: { root: "body", body: "body", head: "head" },
  faces: {
    neutral: { head: { v: "default" } },
    delighted: { head: { v: "closed" } },
    wink: { head: { v: "wink" } },
  },
  rest: {},
};
