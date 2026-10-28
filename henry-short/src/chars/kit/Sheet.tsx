import React from "react";
import { AbsoluteFill } from "remotion";
import { SERIF } from "../../fonts";
import { buildFigure } from "./build";
import { KITS } from "./roster";
import { styleById } from "./styles";
import { Rig } from "../../rig/Rig";

// A contact sheet of the whole cast in one style, for judging a look before a short is cut on it.
// Not part of any short: it exists so a style can be compared against another at a glance.
export const SHEET = { width: 2400, height: 830 };

const SCALE = 0.44;
const BASELINE = 700;
const SPACING = 318;
const FIRST = 160;

const label = (text: string): string => text.replace(/-/g, " ");

export const Sheet: React.FC<{ styleId: string }> = ({ styleId }) => {
  const style = styleById(styleId);
  return (
    <AbsoluteFill style={{ background: style.paper, fontFamily: SERIF, color: style.ink }}>
      <div style={{ position: "absolute", top: 38, left: FIRST, fontSize: 50, letterSpacing: 1 }}>
        {style.label}
      </div>
      {KITS.map((kit, i) => {
        const { def, rest, drop } = buildFigure(kit, style);
        const x = FIRST + i * SPACING;
        return (
          <React.Fragment key={kit.id}>
            <Rig def={def} pose={rest} x={x} y={BASELINE - drop * SCALE} scale={SCALE} />
            <div
              style={{
                position: "absolute",
                top: BASELINE + 28,
                left: x - SPACING / 2,
                width: SPACING,
                textAlign: "center",
                fontSize: 27,
                opacity: 0.75,
              }}
            >
              {label(kit.id)}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
