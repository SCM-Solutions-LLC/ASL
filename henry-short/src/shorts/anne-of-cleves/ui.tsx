import type { Layout } from "../../layout";
import { Badge, Banner, Prize, Stamp, TitleCard } from "../../ui/Callouts";
import type { Beats } from "./beats";

// Props sit in the scene, in stage units, so the camera moves them with the set.
const PRIZES = (L: Layout): { palace: [number, number]; manor: [number, number] } =>
  L.vertical
    ? { palace: [1240, 190], manor: [1000, 170] }
    : { palace: [1620, 330], manor: [960, 340] };

export const props = (F: Beats) => (L: Layout) => (
  <>
    <Badge from={F.fourth} to={F.wife4 - 4} x={1150} y={250} text="4TH" />
    <Prize from={F.palace} x={PRIZES(L).palace[0]} y={PRIZES(L).palace[1]} icon="palace" label="Richmond Palace" />
    <Prize from={F.manor} x={PRIZES(L).manor[0]} y={PRIZES(L).manor[1]} icon="palace" label="Bletchingley" />
  </>
);

// Cards sit over the frame, in output px, so they stay put whatever the camera does.
export const ui = (F: Beats) => () => (
  <>
    <TitleCard from={F.wife4} to={F.henry + 20} kicker="WIFE #4 · 1540" title="ANNE OF CLEVES" />
    <Stamp at={F.annulled} to={F.walked + 6} text="ANNULLED" />
    <Banner from={F.kings - 6} text={"“The King’s Sister”"} />
  </>
);
