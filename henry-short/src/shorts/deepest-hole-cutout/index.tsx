import React from "react";
import { Board, Paper, Shot, Word, YELLOW, makeCut } from "../../deck/kit";
import { makeEdit } from "../../edit";
import alignment from "../../generated/deepest-hole.alignment.json";
import type { Short } from "../types";

// The deepest-hole short as a deck of collage cards: same voice-over, same script, same sourced
// numbers as src/shorts/deepest-hole, with a new picture track. See src/deck/kit.tsx for the look and
// src/shorts/cleopatra-cutout for the deck this one follows.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["dinner", "plate."],
    ["nineteen", "years."],
    ["twelve", "kilometres"],
    ["crust."],
    ["hundred", "and", "eighty"],
    ["six", "thousand"],
  ],
  breakAfter: ["dug"],
});

// The pictures in public/cutout/hole/, with their pixel sizes.
const PICS = {} as const;
export const Cut = makeCut("hole", PICS);

const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={edit.duration} tilt={-1.5} sheet={YELLOW}>
      <Word text="TO DO" at={3} />
    </Shot>
  </Board>
);

export const deepestHoleCutout: Short = {
  slug: "deepest-hole-cutout",
  title: "The deepest hole ever dug (cutout)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "geology",
  sfx: [{ at: 0, name: "pop" }],
};
