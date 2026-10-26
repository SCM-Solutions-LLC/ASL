import { figure, figureRest } from "../../chars/figure";
import { drawnActor } from "../../chars/actors";

// Catherine of Aragon: Spanish black and gold, gable hood. Built from the shared figure spec, so
// she inherits the same joints, faces and moves as everyone else in the channel.
export const catherine = drawnActor(
  "catherine",
  figure({ gown: "#2b2b38", trim: "#c9a227", skin: "#e8bf98", hair: "#3b2416", drape: "#14141c", headwear: "gable" }),
  figureRest,
);
