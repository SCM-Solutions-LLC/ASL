import React from "react";
import { Composition } from "remotion";
import { Scene } from "./Scene";
import { SHORTS } from "./shorts";
import type { Short } from "./shorts/types";

// 9:16 is what gets posted; 16:9 is the same staged scene framed wider, for the monthly long-form.
const FORMATS = [
  { suffix: "", width: 1080, height: 1920 },
  { suffix: "Wide", width: 1920, height: 1080 },
];

// Remotion serialises defaultProps, and a short is mostly functions — choreography, props, camera —
// so each composition closes over its own short instead of being handed one.
const bind = (short: Short, look: string): React.FC<{ debug?: boolean }> => {
  const Bound: React.FC<{ debug?: boolean }> = ({ debug }) => <Scene short={short} look={look} debug={debug} />;
  Bound.displayName = `${short.slug}-${look}`;
  return Bound;
};

// Every short × every look it defines × both formats, so nothing is registered by hand.
const ENTRIES = SHORTS.flatMap((short) =>
  short.looks.flatMap((look) =>
    FORMATS.map((f) => ({
      id: `${short.slug}-${look.id}${f.suffix}`,
      short,
      component: bind(short, look.id),
      ...f,
    })),
  ),
);

export const RemotionRoot: React.FC = () => (
  <>
    {ENTRIES.map((e) => (
      <Composition
        key={e.id}
        id={e.id}
        component={e.component}
        durationInFrames={e.short.edit.duration}
        fps={e.short.edit.fps}
        width={e.width}
        height={e.height}
        defaultProps={{ debug: false }}
      />
    ))}
  </>
);
