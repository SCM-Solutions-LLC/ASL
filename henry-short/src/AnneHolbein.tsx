import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Camera, F, Sfx } from "./AnneCutout";
import { PD_SCALE, pdAnne, pdHenry } from "./chars/pd";
import { SEGMENTS, VO_END } from "./edit";
import { Layout, STAGE, useLayout } from "./layout";
import { addPose, idle, poseAt } from "./rig/animate";
import { Rig } from "./rig/Rig";
import type { Key } from "./rig/types";
import { Banner, Badge, Prize, Stamp, TitleCard } from "./ui/Callouts";
import { Captions } from "./ui/Captions";

// $0 version: Holbein's own portraits as paper cut-outs. Same VO, edit, captions and beats as AnneCutout.
const SH = PD_SCALE.henry;
const SA = PD_SCALE.anne;

// Root offsets are in source-painting pixels (stage units / scale), measured from each character's mark.
const henryKeys = (L: Layout): Key[] => {
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
};

const anneKeys = (L: Layout): Key[] => {
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
    { f: VO_END + 4, pose: { head: { r: 6, v: "wink" } }, ease: "back" },
  ];
};

// Set dressed with pieces of the Henry painting's own background: lattice wall, gold damask, Turkish carpet.
// Pushed back (soft, dark) so the sharp cut-outs read in front of it.
const Hall: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, filter: "blur(3px) brightness(0.62) saturate(0.85)" }}>
    <Img src={staticFile("kit/pd/wall.jpg")} style={{ position: "absolute", left: -400, top: -500, width: 2720, height: 1380, filter: "brightness(0.8)" }} />
    <Img src={staticFile("kit/pd/damask.jpg")} style={{ position: "absolute", left: 520, top: -500, width: 880, height: 1360, boxShadow: "0 0 60px rgba(0,0,0,0.6)", borderLeft: "10px solid #3a2410", borderRight: "10px solid #3a2410" }} />
    <Img src={staticFile("kit/pd/carpet.jpg")} style={{ position: "absolute", left: -400, top: 860, width: 2720, height: 900 }} />
    <div style={{ position: "absolute", left: -400, right: -400, top: 860, height: 60, background: "linear-gradient(rgba(0,0,0,0.55), transparent)" }} />
    <div style={{ position: "absolute", left: -400, right: -400, top: -500, height: 2300, background: "radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
  </div>
);

// Paper cut-outs cast a hard offset shadow, like card on card.
const Cutout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(7px 9px 0 rgba(0,0,0,0.38))" }}>{children}</div>
);

export const AnneHolbein: React.FC<{ debug?: boolean }> = ({ debug }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const henryPose = idle(frame, 1, "body", "head", poseAt(henryKeys(L), frame));
  const walking = frame > F.walked && frame < F.palace;
  const annePose = addPose(idle(frame, 2, "body", "head", poseAt(anneKeys(L), frame)), {
    skirt: { y: walking ? -Math.abs(Math.sin((frame - F.walked) / 3.2)) * 40 : 0 },
  });
  const henryFlip = frame >= F.wanted && frame < F.walked + 8;
  const shake = frame >= F.annulled && frame < F.annulled + 9 ? Math.sin(frame * 2.7) * 12 * (1 - (frame - F.annulled) / 9) : 0;
  const zoom = interpolate(frame, [0, VO_END], [1, 1.07], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera L={L} zoom={zoom} shake={shake}>
        <Hall />
        <Cutout>
          <Rig def={pdHenry} pose={henryPose} x={L.marks.henry} y={STAGE.floor} scale={SH} flip={henryFlip} debug={debug} />
          <Rig def={pdAnne} pose={annePose} x={L.marks.anne} y={STAGE.floor} scale={SA} debug={debug} />
        </Cutout>
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
