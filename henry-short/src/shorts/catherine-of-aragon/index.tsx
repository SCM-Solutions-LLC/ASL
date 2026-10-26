import { Easing, interpolate } from "remotion";
import { drawnHenry } from "../../chars/actors";
import { makeEdit } from "../../edit";
import { Badge, Stamp, TitleCard } from "../../ui/Callouts";
import { bob, cheer, doubleTake, enter, eyeRoll, knock, point, relax, settle } from "../../moves";
import { bind } from "../../rig/cast";
import alignment from "../../generated/six-wives.alignment.json";
import type { Short } from "../types";
import { catherine } from "./cast";
import { StoneHall } from "./set";

// Wife one, cut from the same six-wives VO as the Anne short. Written on src/moves rather than
// hand-keyed, which is what a third short should look like: beats, then gestures against them.
const edit = makeEdit({
  alignment,
  cut: [{ from: "Wife one", to: "do it.", tail: 0.25 }],
  keyPhrases: [["24", "years"], ["annulled."], ["rome"]],
  breakAfter: ["marriage,"],
});

const F = {
  name: edit.at("catherine"),
  aragon: edit.at("aragon."),
  years: edit.at("24"),
  annulled: edit.at("annulled."),
  henry: edit.at("henry"),
  broke: edit.at("broke"),
  rome: edit.at("rome"),
  end: edit.at("it."),
  voEnd: edit.voEnd,
};

const kate = bind(catherine);
const hal = bind(drawnHenry);

export const catherineOfAragon: Short = {
  slug: "catherine-of-aragon",
  title: "Catherine of Aragon",
  edit,
  looks: [
    {
      id: "Illustrated",
      Set: StoneHall,
      cast: (L) => [
        {
          actor: drawnHenry,
          mark: L.marks.left,
          // He is not there for the marriage; he arrives to break it, and points the blame her way.
          keys: [
            hal.rest(0, { root: { x: (L.left - 300 - L.marks.left) / drawnHenry.scale } }),
            ...enter(hal, F.henry - 10, { from: (L.left - 300 - L.marks.left) / drawnHenry.scale, over: 16 }),
            ...point(hal, F.broke, { side: "R", hold: 26 }),
            ...knock(hal, F.rome, { deg: -6 }),
            ...relax(hal, F.end),
          ],
        },
        {
          actor: catherine,
          mark: L.marks.right,
          keys: [
            kate.rest(0, { root: { x: (1920 / 2 - L.marks.right) / catherine.scale } }),
            ...settle(kate, 0),
            ...bob(kate, F.name + 10, { dip: 18, tilt: -7 }),
            // 24 years of it, and then the double take when it is taken away.
            ...cheer(kate, F.years),
            ...relax(kate, F.years + 26),
            // She steps aside to make room for him.
            kate.rest(F.henry - 8, { root: { x: (1920 / 2 - L.marks.right) / catherine.scale } }, { ease: "hold" }),
            kate.key(F.henry + 10, { root: { x: 0 } }),
            ...doubleTake(kate, F.annulled),
            ...eyeRoll(kate, F.rome + 6, { over: 16 }),
            ...relax(kate, F.voEnd - 10),
          ],
        },
      ],
    },
  ],
  props: (L) => <Badge from={F.years} to={F.annulled - 4} x={L.marks.right - 40} y={210} text="24" />,
  ui: () => (
    <>
      <TitleCard from={F.name} to={F.years - 6} kicker="WIFE #1 · 1509" title="CATHERINE OF ARAGON" />
      <Stamp from={F.annulled} to={F.broke + 10} text="ANNULLED" />
    </>
  ),
  camera: {
    zoom: (f) => interpolate(f, [0, F.voEnd], [1, 1.06], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) }),
    shake: (f) => (f >= F.annulled && f < F.annulled + 9 ? Math.sin(f * 2.7) * 11 * (1 - (f - F.annulled) / 9) : 0),
  },
  sfx: [
    { at: F.years, name: "pop" },
    { at: F.henry - 10, name: "whoosh" },
    { at: F.annulled, name: "thud", volume: 0.7 },
    { at: F.rome, name: "dirt", volume: 0.4 },
  ],
};
