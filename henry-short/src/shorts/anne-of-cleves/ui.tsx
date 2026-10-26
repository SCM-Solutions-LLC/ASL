import type { Layout } from "../../layout";
import { Badge, Banner, Prize, Stamp, TitleCard } from "../../ui/Callouts";
import type { Beats } from "./beats";

// Props sit in the scene, in stage units, so the camera moves them with the set.
export const props = (F: Beats) => (L: Layout) => (
  <>
    <Badge from={F.fourth} to={F.wife4 - 4} x={1150} y={250} text="4TH" />
    <Prize from={F.palace} x={L.prizes.palace[0]} y={L.prizes.palace[1]} icon="palace" label="Richmond Palace" />
    <Prize from={F.castle} x={L.prizes.castle[0]} y={L.prizes.castle[1]} icon="castle" label="Hever Castle" />
  </>
);

// Cards sit over the frame, in output px, so they stay put whatever the camera does.
export const ui = (F: Beats) => () => (
  <>
    <TitleCard from={F.wife4} to={F.henry + 20} kicker="WIFE #4 · 1540" title="ANNE OF CLEVES" />
    <Stamp from={F.annulled} to={F.walked + 6} text="ANNULLED" />
    <Banner from={F.kings - 6} text={"“The King’s Beloved Sister”"} />
  </>
);
