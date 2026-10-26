import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { anne, anneHipsHands, anneRest } from "./chars/anne";
import { henry, henryRest } from "./chars/henry";
import { at, SEGMENTS, VO_END } from "./edit";
import { CHAR_SCALE as S, Layout, STAGE, useLayout } from "./layout";
import { addPose, idle, poseAt } from "./rig/animate";
import { Rig } from "./rig/Rig";
import type { Key } from "./rig/types";
import { Banner, Badge, Prize, Stamp, TitleCard } from "./ui/Callouts";
import { Captions } from "./ui/Captions";

// Every beat hangs off a spoken word, so a re-cut VO keeps the animation in sync.
export const F = {
  fourth: at("fourth"),
  all: at("all."),
  wife4: at("wife", 1),
  henry: at("henry"),
  once: at("once"),
  wanted: at("wanted"),
  annulled: at("annulled,"),
  walked: at("walked"),
  palace: at("palace,"),
  castle: at("castle,"),
  kings: at("king's"),
  sister: at("sister."),
};

// Hip heights that put each character's feet / hem on the floor.
const HENRY_Y = STAGE.floor - 265 * S;
const ANNE_Y = STAGE.floor - 562 * S;

// Root x offsets are in rig units (stage units / S), measured from each character's mark.
const henryKeys = (L: Layout): Key[] => {
  const off = (L.left - 260 - L.marks.henry) / S;
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
};

const anneKeys = (L: Layout): Key[] => {
  const centre = (STAGE.w / 2 - L.marks.anne) / S;
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
    { f: VO_END + 6, pose: { eyes: { v: "wink" }, head: { r: 6 } }, ease: "back" },
  ];
};

// Placeholder set, in stage units. Drawn wider and taller than 16:9 so the vertical crop never runs out.
const Hall: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: -400, right: -400, top: -500, height: 1320, background: "linear-gradient(#3a2414, #5a3a22 40%, #8a5a32)" }} />
    {[360, 660, 960, 1260, 1560].map((x) => (
      <div key={x} style={{ position: "absolute", left: x - 100, top: 120, width: 200, height: 520, borderRadius: "100px 100px 0 0", background: "linear-gradient(#ffe9a8, #d99a4a)", border: "8px solid #2a1a12" }} />
    ))}
    <div style={{ position: "absolute", left: -400, right: -400, top: 820, height: 800, background: "linear-gradient(#6b4a2e, #2a1a10 60%)" }} />
  </>
);

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

export const AnneCutout: React.FC<{ debug?: boolean }> = ({ debug }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const henryPose = idle(frame, 1, "torso", "eyes", poseAt(henryKeys(L), frame));
  const walking = frame > F.walked && frame < F.palace;
  const annePose = addPose(idle(frame, 2, "torso", "eyes", poseAt(anneKeys(L), frame)), {
    torso: { y: walking ? -Math.abs(Math.sin((frame - F.walked) / 3.2)) * 12 : 0 },
  });
  const henryFlip = frame >= F.wanted && frame < F.walked + 8;
  const shake = frame >= F.annulled && frame < F.annulled + 9 ? Math.sin(frame * 2.7) * 12 * (1 - (frame - F.annulled) / 9) : 0;
  const zoom = interpolate(frame, [0, VO_END], [1, 1.07], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera L={L} zoom={zoom} shake={shake}>
        <Hall />
        <Rig def={henry} pose={henryPose} x={L.marks.henry} y={HENRY_Y} scale={S} flip={henryFlip} debug={debug} />
        <Rig def={anne} pose={annePose} x={L.marks.anne} y={ANNE_Y} scale={S} debug={debug} />
        <Badge from={F.fourth} to={F.wife4 - 4} x={1150} y={250} text="4TH" />
        <Prize from={F.palace} x={L.prizes.palace[0]} y={L.prizes.palace[1]} icon="palace" label="Richmond Palace" />
        <Prize from={F.castle} x={L.prizes.castle[0]} y={L.prizes.castle[1]} icon="castle" label="Hever Castle" />
      </Camera>
      <AbsoluteFill style={{ background: L.vertical ? "linear-gradient(transparent 72%, rgba(20,12,6,0.75) 76%)" : "linear-gradient(transparent 80%, rgba(20,12,6,0.7) 92%)" }} />
      <TitleCard from={F.wife4} to={F.henry + 20} kicker="WIFE #4 · 1540" title="ANNE OF CLEVES" />
      <Stamp from={F.annulled} to={F.walked + 6} text="ANNULLED" />
      <Banner from={F.kings - 6} text={"“The King’s Beloved Sister”"} />
      <Captions />
      {SEGMENTS.map((s) => (
        <Sequence key={s.from} from={s.at} durationInFrames={s.to - s.from} layout="none">
          <Audio src={staticFile("vo.wav")} trimBefore={s.from} trimAfter={s.to} />
        </Sequence>
      ))}
      <Sfx at={F.fourth} name="pop" />
      <Sfx at={F.wife4 - 2} name="whoosh" volume={0.35} />
      <Sfx at={F.henry - 10} name="whoosh" />
      <Sfx at={F.annulled} name="thud" volume={0.7} />
      <Sfx at={F.palace} name="pop" />
      <Sfx at={F.castle} name="pop" />
      <Sfx at={F.kings - 6} name="sparkle" volume={0.4} />
    </AbsoluteFill>
  );
};
