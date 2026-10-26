import { Composition } from "remotion";
import { AnneCutout } from "./AnneCutout";
import { AnneHolbein } from "./AnneHolbein";
import { DURATION, FPS } from "./edit";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AnneCutout"
        component={AnneCutout}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ debug: false }}
      />
      <Composition
        id="AnneCutoutWide"
        component={AnneCutout}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ debug: false }}
      />
      <Composition
        id="AnneHolbein"
        component={AnneHolbein}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ debug: false }}
      />
      <Composition
        id="AnneHolbeinWide"
        component={AnneHolbein}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ debug: false }}
      />
    </>
  );
};
