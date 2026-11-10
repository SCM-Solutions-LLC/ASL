import React from "react";
import { Board, Paper, Shot, Word, YELLOW, makeCut } from "../../deck/kit";
import { makeEdit } from "../../edit";
import alignment from "../../generated/age-of-sunlight.alignment.json";
import type { Short } from "../types";

// The age-of-sunlight short as a deck of collage cards: same voice-over, same script, same sourced
// numbers as src/shorts/age-of-sunlight, with a new picture track. See src/deck/kit.tsx for the look and
// src/shorts/cleopatra-cutout for the deck this one follows.
const edit = makeEdit({
  alignment,
  keyPhrases: [["hundred", "thousand"], ["eight", "minutes"], ["photon"], ["ancient"]],
});

// The pictures in public/cutout/sunlight/, with their pixel sizes.
const PICS = {} as const;
export const Cut = makeCut("sunlight", PICS);

const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={edit.duration} tilt={-1.5} sheet={YELLOW}>
      <Word text="TO DO" at={3} />
    </Shot>
  </Board>
);

export const ageOfSunlightCutout: Short = {
  slug: "age-of-sunlight-cutout",
  title: "Sunlight is older than the light (cutout)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "space",
  sfx: [{ at: 0, name: "pop" }],
};
