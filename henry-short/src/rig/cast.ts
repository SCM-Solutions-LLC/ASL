import type { Key, PartDef, PartPose, Pose } from "./types";

// Moves are written against roles rather than part ids. The same person rigged two ways does not
// have the same joints — an illustrated figure has a torso and jointed arms, a painted cut-out has
// a body, a jaw and two forearms — so a move that only knows "the head" works on both, and a move
// that reaches for a joint a figure lacks drops that part of itself instead of failing.
export type Role =
  | "root" // what a walk, slide or squash moves; the part standing on the floor
  | "body" // the upper body, where the rig splits it from the root (Anne's gown vs. her torso)
  | "head"
  | "jaw"
  | "armL"
  | "armR"
  | "foreL"
  | "foreR"
  | "handL"
  | "handR"
  | "eyes"; // where blinks land; a figure without separate eyes blinks through its head art

// Faces differ more than joints do. An illustrated rig poses eyes, brows and mouth separately; a
// painted cut-out only has whole-head art. So moves ask for a named expression, and each figure
// says what that looks like on it — or says nothing, and keeps the face it had.
export type Expression =
  | "neutral"
  | "shocked"
  | "unimpressed"
  | "smug"
  | "annoyed"
  | "delighted"
  | "glance"
  | "wink";

export type RolePose = Partial<Record<Role, PartPose>>;

export type Actor = {
  name: string;
  def: PartDef;
  scale: number; // rig units → stage units
  floor: number; // stage y the root pivot sits at, so feet or hem land on the floor
  roles: Partial<Record<Role, string>>; // absent role = this figure has no such joint
  faces: Partial<Record<Expression, Pose>>; // in part ids, since a face is figure-specific
  rest: Pose;
};

export type Binder = {
  actor: Actor;
  has: (role: Role) => boolean;
  /** A pose from role fragments plus an optional expression; unknown roles are dropped. */
  pose: (frag: RolePose, face?: Expression) => Pose;
  /** A key at frame `f`, built the same way. */
  key: (f: number, frag: RolePose, opts?: { face?: Expression; ease?: Key["ease"] }) => Key;
  /** A key returning the figure to its rest pose, plus anything else it should settle into.
   * Keys accumulate, so a move that disturbs a limb has to say what it goes back to — an empty
   * fragment leaves the limb where the move put it. */
  rest: (f: number, frag?: RolePose, opts?: { face?: Expression; ease?: Key["ease"] }) => Key;
};

export const bind = (actor: Actor): Binder => {
  const has = (role: Role) => actor.roles[role] !== undefined;

  const pose = (frag: RolePose, face?: Expression): Pose => {
    const out: Pose = {};
    for (const role of Object.keys(frag) as Role[]) {
      const id = actor.roles[role];
      if (id) out[id] = { ...out[id], ...frag[role] };
    }
    if (face) for (const [id, p] of Object.entries(actor.faces[face] ?? {})) out[id] = { ...out[id], ...p };
    return out;
  };

  return {
    actor,
    has,
    pose,
    key: (f, frag, opts = {}) => ({ f, pose: pose(frag, opts.face), ease: opts.ease }),
    rest: (f, frag = {}, opts = {}) => ({
      f,
      pose: { ...actor.rest, ...pose(frag, opts.face ?? "neutral") },
      ease: opts.ease,
    }),
  };
};
