import { Easing } from "remotion";
import type { Ease, Key, PartPose, Pose } from "./types";

const curves: Record<Exclude<Ease, "hold">, (t: number) => number> = {
  inOut: Easing.inOut(Easing.cubic),
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  back: Easing.out(Easing.back(1.7)),
  linear: (t) => t,
};

const merge = (a: Pose, b: Pose): Pose => {
  const out: Pose = { ...a };
  for (const id of Object.keys(b)) out[id] = { ...a[id], ...b[id] };
  return out;
};

// Each key inherits everything set before it, so keys only need to name what changes.
const resolve = (keys: Key[]): Key[] => {
  let acc: Pose = {};
  return [...keys]
    .sort((a, b) => a.f - b.f)
    .map((k) => {
      acc = merge(acc, k.pose);
      return { ...k, pose: acc };
    });
};

const lerpPart = (a: PartPose = {}, b: PartPose = {}, t: number): PartPose => {
  const mix = (x: number | undefined, y: number | undefined, d: number) =>
    (x ?? d) + ((y ?? d) - (x ?? d)) * t;
  return {
    r: mix(a.r, b.r, 0),
    x: mix(a.x, b.x, 0),
    y: mix(a.y, b.y, 0),
    sx: mix(a.sx, b.sx, 1),
    sy: mix(a.sy, b.sy, 1),
    v: a.v ?? b.v,
  };
};

export const poseAt = (keys: Key[], frame: number): Pose => {
  const ks = resolve(keys);
  if (ks.length === 0) return {};
  if (frame <= ks[0].f) return ks[0].pose;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (frame >= b.f) continue;
    const ease = b.ease ?? "inOut";
    if (ease === "hold") return a.pose;
    const t = curves[ease]((frame - a.f) / (b.f - a.f));
    const out: Pose = {};
    for (const id of new Set([...Object.keys(a.pose), ...Object.keys(b.pose)]))
      out[id] = lerpPart(a.pose[id], b.pose[id], t);
    return out;
  }
  return ks[ks.length - 1].pose;
};

// Layer procedural motion (breathing, blinks, walk bob) on top of a keyed pose.
export const addPose = (base: Pose, extra: Pose): Pose => {
  const out: Pose = { ...base };
  for (const id of Object.keys(extra)) {
    const a = base[id] ?? {};
    const b = extra[id];
    out[id] = {
      r: (a.r ?? 0) + (b.r ?? 0),
      x: (a.x ?? 0) + (b.x ?? 0),
      y: (a.y ?? 0) + (b.y ?? 0),
      sx: (a.sx ?? 1) * (b.sx ?? 1),
      sy: (a.sy ?? 1) * (b.sy ?? 1),
      v: b.v ?? a.v,
    };
  }
  return out;
};

// Idle life every rigged character gets: breathing, plus a blink every ~3s unless the eyes are acting.
export const idle = (frame: number, seed: number, torso: string, eyes: string, pose: Pose): Pose => {
  const extra: Pose = { [torso]: { sy: 1 + Math.sin((frame + seed * 13) / 22) * 0.008 } };
  const cycle = (frame + seed * 41) % 96;
  const eyesActing = pose[eyes]?.v && pose[eyes]?.v !== "default";
  if (cycle < 4 && !eyesActing) extra[eyes] = { v: "closed" };
  return addPose(pose, extra);
};
