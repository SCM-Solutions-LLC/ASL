import type { Edit } from "../../edit";

// Every beat hangs off a spoken word, so a re-cut VO keeps the animation in sync.
export const beats = (e: Edit) => ({
  fourth: e.at("fourth"),
  all: e.at("all."),
  wife4: e.at("wife", 1),
  henry: e.at("henry"),
  once: e.at("once"),
  wanted: e.at("wanted"),
  annulled: e.at("annulled,"),
  walked: e.at("walked"),
  palace: e.at("palace,"),
  castle: e.at("castle,"),
  kings: e.at("king's"),
  sister: e.at("sister."),
  voEnd: e.voEnd,
});

export type Beats = ReturnType<typeof beats>;
