import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Layout } from "./layout";
import { STAGE, useLayout } from "./layout";
import { addPose, idle, poseAt } from "./rig/animate";
import { Rig } from "./rig/Rig";
import type { Short, Staged } from "./shorts/types";
import { Captions } from "./ui/Captions";

// Maps stage units into the frame for the current layout; zoom and shake ride on top.
export const Camera: React.FC<{ L: Layout; zoom: number; shake: number; children: React.ReactNode }> = ({ L, zoom, shake, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: width / 2, top: height / 2, width: 0, height: 0, scale: `${L.zoom * zoom}` }}>
        <div style={{ position: "absolute", left: -L.center[0] + shake, top: -L.center[1] + shake * 0.6, width: STAGE.w, height: STAGE.h }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({ at: from, name, volume = 0.45 }) => (
  <Sequence from={from} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// Breathing rides on the upper body where the rig has one, and blinks go through whichever part
// carries the eyes — separate eyes on an illustrated figure, the whole head on a painted cut-out.
const Figure: React.FC<{ staged: Staged; seed: number; mark: number; debug?: boolean }> = ({ staged, seed, mark, debug }) => {
  const frame = useCurrentFrame();
  const { actor, keys, flip, extra } = staged;
  const breath = actor.roles.body ?? actor.roles.root ?? "";
  const blink = actor.roles.eyes ?? actor.roles.head ?? "";
  const pose = idle(frame, seed, breath, blink, poseAt(keys, frame));
  return (
    <Rig
      def={actor.def}
      pose={extra ? addPose(pose, extra(frame)) : pose}
      x={mark}
      y={actor.floor}
      scale={actor.scale}
      flip={flip?.(frame)}
      debug={debug}
    />
  );
};

// Renders one short in one look. Format (9:16 or 16:9) is the layout's business, not the short's.
export const Scene: React.FC<{ short: Short; look: string; debug?: boolean }> = ({ short, look, debug }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const { edit } = short;
  const chosen = short.looks.find((l) => l.id === look);
  if (!chosen) throw new Error(`Short "${short.slug}" has no look "${look}"`);
  const { Set, Figures = React.Fragment } = chosen;
  const cast = chosen.cast(L);
  const zoom = short.camera?.zoom?.(frame) ?? 1;
  const shake = short.camera?.shake?.(frame) ?? 0;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera L={L} zoom={zoom} shake={shake}>
        <Set />
        <Figures>
          {cast.map((s, i) => {
            const Frame = s.frame ?? React.Fragment;
            return (
              <Frame key={s.actor.name}>
                <Figure staged={s} seed={i + 1} mark={s.mark} debug={debug} />
              </Frame>
            );
          })}
        </Figures>
        {short.props?.(L)}
      </Camera>
      {short.scrim === false ? null : (
        <AbsoluteFill style={{ background: L.vertical ? "linear-gradient(transparent 72%, rgba(20,12,6,0.75) 76%)" : "linear-gradient(transparent 80%, rgba(20,12,6,0.7) 92%)" }} />
      )}
      {short.ui?.(L)}
      <Captions words={edit.words} />
      {edit.segments.map((s) => (
        <Sequence key={s.from} from={s.at} durationInFrames={s.to - s.from} layout="none">
          <Audio src={staticFile(edit.audio)} trimBefore={s.from} trimAfter={s.to} />
        </Sequence>
      ))}
      {short.sfx?.map((s, i) => (
        <Sfx key={i} at={s.at} name={s.name} volume={s.volume} />
      ))}
    </AbsoluteFill>
  );
};
