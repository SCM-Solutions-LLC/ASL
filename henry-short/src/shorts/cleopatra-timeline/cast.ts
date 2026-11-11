import { drawnActor } from "../../chars/actors";
import { figure, figureRest } from "../../chars/figure";

// Cleopatra VII: white linen and gold, a dark wig behind the head, a gold diadem. Built from the
// shared figure spec, so she has the same joints, faces and moves as everyone else in the channel.
// The silhouette is the channel's gown rather than Ptolemaic dress — the palette carries the place.
export const cleopatra = drawnActor(
  "cleopatra",
  figure({ gown: "#f1e7d0", trim: "#d4a72c", skin: "#cf9f74", hair: "#1c1410", drape: "#1c1410", headwear: "coronet" }),
  figureRest,
);
