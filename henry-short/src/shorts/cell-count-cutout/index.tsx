import React from "react";
import { Board, Paper, Shot, Word, YELLOW, makeCut } from "../../deck/kit";
import { makeEdit } from "../../edit";
import alignment from "../../generated/cell-count.alignment.json";
import type { Short } from "../types";

// The cell-count short as a deck of collage cards: same voice-over, same script, same sourced
// numbers as src/shorts/cell-count, with a new picture track. See src/deck/kit.tsx for the look and
// src/shorts/cleopatra-cutout for the deck this one follows.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["less", "than", "half"],
    ["thirty", "trillion"],
    ["Thirty-eight", "trillion"],
    ["two", "hundred", "grams."],
    ["Eighty-four", "percent"],
    ["mostly", "blood."],
    ["outnumbered"],
  ],
  breakAfter: ["scale,"],
});

// The pictures in public/cutout/cells/, with their pixel sizes.
const PICS = {} as const;
export const Cut = makeCut("cells", PICS);

const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={edit.duration} tilt={-1.5} sheet={YELLOW}>
      <Word text="TO DO" at={3} />
    </Shot>
  </Board>
);

export const cellCountCutout: Short = {
  slug: "cell-count-cutout",
  title: "By cell count, you are less than half human (cutout)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "science",
  sfx: [{ at: 0, name: "pop" }],
};
