import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../../layout";
import type { Beats } from "./beats";

// The "illustrated stills" look: generated comic panels cut on VO beats. Nothing in a panel moves,
// so all the motion is camera — a slow drift per shot, and a hard punch-in on a chosen word.
type Shot = { from: number; src: string; punch?: number };

const shots = (F: Beats): Shot[] => [
  { from: 0, src: "1.png" },
  { from: F.wife4, src: "2.png" },
  { from: F.henry, src: "3.png", punch: F.wanted },
  { from: F.six, src: "4.png" },
  { from: F.walked, src: "5.png" },
  // The hero panel again, held close: a sixth panel was never generated, and a re-crop reads as a new shot.
  { from: F.kings, src: "1.png", punch: F.kings },
];

export const comicStills = (F: Beats): React.FC => {
  const list = shots(F);
  const Stills: React.FC = () => {
    const frame = useCurrentFrame();
    const L = useLayout();
    const { width, height, durationInFrames } = useVideoConfig();
    const i = list.filter((s) => s.from <= frame).length - 1;
    const shot = list[i];
    const t = (frame - shot.from) / ((list[i + 1]?.from ?? durationInFrames) - shot.from);
    // Alternate pushing in and pulling out so consecutive shots do not drift the same way. The
    // 1.04 floor keeps the panel's edge out of frame when the camera shakes.
    const drift = 1.04 + 0.08 * (i % 2 ? 1 - t : t);
    const punch = shot.punch !== undefined && frame >= shot.punch ? 1.35 : 1;
    // The panel fills exactly the slice of the stage this format's camera shows.
    const w = width / L.zoom;
    const h = height / L.zoom;
    return (
      <Img
        src={staticFile(`comic/anne-of-cleves/${shot.src}`)}
        style={{
          position: "absolute",
          left: L.center[0] - w / 2,
          top: L.center[1] - h / 2,
          width: w,
          height: h,
          // shortcut: panels are generated 9:16, so 16:9 crops to the middle band; generate wide panels if the Wide cut matters.
          objectFit: "cover",
          transformOrigin: "50% 30%", // faces sit in the upper half of every panel
          scale: `${drift * punch}`,
        }}
      />
    );
  };
  return Stills;
};
