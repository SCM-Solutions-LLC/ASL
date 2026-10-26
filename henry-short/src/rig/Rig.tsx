import React from "react";
import { Img, staticFile } from "remotion";
import type { PartDef, Pose } from "./types";

const Part: React.FC<{ def: PartDef; pose: Pose; root?: boolean; debug?: boolean }> = ({
  def,
  pose,
  root,
  debug,
}) => {
  const p = pose[def.id] ?? {};
  const art = def.art[p.v ?? "default"] ?? def.art.default;
  const [ax, ay] = root ? [0, 0] : def.at;
  const kids = def.children ?? [];
  const draw = (list: PartDef[]) =>
    list.map((c) => <Part key={c.id} def={c} pose={pose} debug={debug} />);

  return (
    <div
      style={{
        position: "absolute",
        left: ax - def.pivot[0],
        top: ay - def.pivot[1],
        width: def.w,
        height: def.h,
        transformOrigin: `${def.pivot[0]}px ${def.pivot[1]}px`,
        translate: `${p.x ?? 0}px ${p.y ?? 0}px`,
        rotate: `${p.r ?? 0}deg`,
        scale: `${p.sx ?? 1} ${p.sy ?? 1}`,
      }}
    >
      {draw(kids.filter((c) => (c.z ?? 0) < 0))}
      <div style={{ position: "absolute", inset: 0 }}>
        {"src" in art ? (
          <Img src={staticFile(art.src)} style={{ width: "100%", height: "100%" }} />
        ) : (
          art.node
        )}
      </div>
      {draw(kids.filter((c) => (c.z ?? 0) >= 0))}
      {debug ? (
        <div
          style={{
            position: "absolute",
            left: def.pivot[0] - 6,
            top: def.pivot[1] - 6,
            width: 12,
            height: 12,
            borderRadius: 6,
            background: "#00e5ff",
            outline: "2px solid #000",
          }}
        />
      ) : null}
    </div>
  );
};

// Places the root part's pivot at (x, y) in the parent's coordinates.
export const Rig: React.FC<{
  def: PartDef;
  pose: Pose;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  debug?: boolean;
}> = ({ def, pose, x, y, scale = 1, flip, debug }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 0,
      height: 0,
      scale: `${flip ? -scale : scale} ${scale}`,
    }}
  >
    <Part def={def} pose={pose} root debug={debug} />
  </div>
);
