import React from "react";
import { useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { SERIF } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/altar-stone.alignment.json";
import { Tag as BaseTag } from "../../scenes/space";
import type { Short } from "../types";
import { Haul } from "./haul";
import { Coast, Ink, PLACES, projector, Route, Sea, VIEWS } from "./map";
import type { Project, View } from "./map";
import { Boat, clamp01, Credit, ease, FilmGrain, Grains, LightLeak, Photo, ramp, Study } from "./shots";

// The voice-over is Kokoro (`npm run tts -- altar-stone`) from script/altar-stone.txt, fact-checked
// in factcheck/altar-stone.json. Every on-screen label below is a claim too (A6): each says only what
// that file's SOURCES block supports, and anything drawn rather than measured says so on screen.
const edit = makeEdit({
  alignment,
  cut: [{ from: "In 2024, Stonehenge's", to: "got there?", tail: 0.8 }],
  keyPhrases: [["traced", "to", "Scotland."], ["can't", "agree"], ["six", "tonnes"], ["sea."], ["eight", "months"], ["part", "of", "the", "way,"], ["every", "way."], ["no", "one", "knows."], ["how", "do", "you", "think"]],
  // "?" does not end a caption page on its own, and the long lines need one break each.
  breakAfter: ["grains", "kilometres?", "Britain,", "sledge,", "glacier?", "says", "later,", "Scotland", "far", "down,", "knows."],
});

const F = {
  traced: edit.at("traced"),
  scotland: edit.at("Scotland."),
  now: edit.at("Two"),
  exactly: edit.at("still"),
  ages: edit.at("ages"),
  tiny: edit.at("tiny"),
  sandstone: edit.at("sandstone"),
  ifSo: edit.at("If"),
  six: edit.at("six"),
  travel: edit.at("travel"),
  seven: edit.at("seven"),
  km: edit.at("kilometres?"),
  suggested: edit.at("suggested"),
  but: edit.at("But"),
  boat: edit.at("boat"),
  doubts: edit.at("doubts"),
  overland: edit.at("Overland,"),
  eight: edit.at("eight"),
  glacier: edit.at("glacier?"),
  model: edit.at("model"),
  part: edit.at("part"),
  most: edit.at("most."),
  then: edit.at("Then,"),
  three: edit.at("three"),
  closer: edit.at("closer."),
  many: edit.at("Many"),
  ruled: edit.at("could", 2),
  outcrop: edit.at("outcrop"),
  match: edit.at("match"),
  // The recap: "Six tonnes, from a spot no one has pinned down, by a route no one knows. Sea, sledge or ice: ..."
  recap: edit.at("six", 2),
  spot: edit.at("spot"),
  route: edit.at("route"),
  sea: edit.at("sea", 1),
  sledge: edit.at("sledge", 1),
  ice: edit.at("ice", 2),
  how: edit.at("how", 1),
  end: edit.duration,
};

// Shot windows, each fading in over 10 frames from its start and out over 10 to its end.
const SHOTS = {
  // Starts before frame 0 so the first frame is the photo, not a fade from black: the hook opens on it.
  photo: [-10, F.traced + 10],
  map1: [F.traced, F.ages - 6],
  grains: [F.ages - 10, F.sandstone + 4],
  map2: [F.sandstone - 6, F.but - 2],
  boat: [F.but - 6, F.overland + 2],
  haul: [F.overland - 4, F.glacier],
  map3: [F.glacier - 6, F.then],
  study: [F.then - 6, F.many],
  map4: [F.many - 6, F.recap],
  recap: [F.recap - 6, F.end + 10],
} as const;
const vis = (f: number, [a, b]: readonly [number, number]) => Math.min(clamp01((f - a) / 10), clamp01((b - f) / 10));

// The caveat lines carry A6, so they must survive a phone screen: larger than the shared default.
const Tag: typeof BaseTag = (p) => <BaseTag subSize={38} {...p} />;

// Map camera, keyed to the beats: it follows the line up to Scotland, holds close on the northeast,
// pulls back for the distance, rides the ice south, then pans the outcrops. Keys are sorted by frame.
const cam = (lon: number, lat: number, z: number): View => ({ lon, lat, z });
const CAM: [number, View][] = (
  [
    [SHOTS.map1[0], VIEWS.uk],
    [F.scotland, cam(-2.4, 56.6, 1.6)],
    [SHOTS.map1[1], cam(-2.6, 57.4, 1.9)],
    [SHOTS.map2[0], cam(-2.4, 57.3, 1.8)],
    [F.six, cam(-2.5, 56.8, 1.6)],
    [F.seven, VIEWS.uk],
    [SHOTS.map2[1], cam(-3.4, 54.8, 0.95)],
    [SHOTS.map3[0], cam(-2.6, 54.8, 0.95)],
    [F.part, cam(-0.5, 56.0, 1.3)],
    [SHOTS.map3[1], cam(-0.8, 53.5, 1.3)],
    [SHOTS.map4[0], VIEWS.uk],
    [SHOTS.map4[0] + 30, VIEWS.ne],
    [F.ruled, cam(-3.6, 57.9, 3.3)],
    [F.match, cam(-3.3, 58.3, 3.2)],
    [SHOTS.map4[1], cam(-3.4, 58.2, 3.6)],
    [F.recap + 24, cam(-3.0, 54.9, 0.95)],
    [F.end, cam(-2.9, 54.8, 1.02)],
  ] as [number, View][]
).sort((a, b) => a[0] - b[0]);
const camAt = (f: number): View => {
  const i = CAM.findIndex(([k]) => k > f);
  if (i <= 0) return CAM[i === 0 ? 0 : CAM.length - 1][1];
  const [a, va] = CAM[i - 1];
  const [b, vb] = CAM[i];
  const k = ease(clamp01((f - a) / (b - a)));
  return { lon: va.lon + (vb.lon - va.lon) * k, lat: va.lat + (vb.lat - va.lat) * k, z: va.z + (vb.z - va.z) * k };
};

// A short punch-in on a spoken beat, for the shots that would otherwise hold still.
const beat = (f: number, at: number) => ease(ramp(f, at - 4, at + 8));
const Push: React.FC<{ s: number; y?: number; children: React.ReactNode }> = ({ s, y = 0, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, scale: `${s}`, translate: `0 ${y}px` }}>{children}</div>
);

// A sea route and its alternative: the 2024 paper argues for the sea but names no route, so both
// coasts are drawn and the label says the route is not known.
const EAST: [number, number][] = [[-2.9, 58.45], [-2.4, 58.3], [-1.6, 57.6], [-1.4, 56.6], [-1.6, 55.8], [-0.6, 54.6], [0.6, 53.6], [1.9, 52.8], [1.9, 51.6], [1.2, 50.85], [0.2, 50.6], [-0.85, 50.66]];
const WEST: [number, number][] = [[-3.5, 58.66], [-5.0, 58.75], [-7.0, 58.7], [-7.8, 57.5], [-7.8, 56.5], [-6.9, 55.75], [-6.0, 55.42], [-5.3, 54.6], [-5.0, 53.5], [-5.5, 52.2], [-5.6, 51.4], [-5.9, 50.6], [-5.85, 50.0], [-5.2, 49.85], [-3.5, 50.1], [-1.95, 50.6]];
// Clarke 2026's ice model: dispersal toward Dogger Bank, then people for the rest (claim 7). The
// ice sheet outline is a sketch, and says so on screen.
const ICE: [number, number][] = [[-8.5, 59.8], [-3, 61.2], [2.5, 60.2], [4, 57.5], [3.4, 55.2], [2.2, 54.2], [0, 53.9], [-2.6, 54.3], [-5, 54.5], [-7.4, 55.6], [-8.8, 57.6]];
const ICE_PATH: [number, number][] = [PLACES.northeast, [-1.6, 57.5], [0.4, 56.1], PLACES.dogger];
const PEOPLE_PATH: [number, number][] = [PLACES.dogger, [0.6, 53.4], [-0.6, 52.2], PLACES.stonehenge];
// Outcrops, in the northeast view. Positions are illustrative (the label says so); the paper's
// sample sites are not drawn because only its abstract was read.
const OUTCROPS: { at: [number, number]; ruled: boolean }[] = [
  [-3.35, 58.45, 1], [-3.2, 58.52, 0], [-3.75, 58.48, 1], [-3.2, 59.02, 1], [-2.95, 58.99, 0], [-3.3, 58.85, 1],
  [-3.95, 58.1, 1], [-4.05, 57.8, 1], [-4.25, 57.6, 1], [-3.3, 57.62, 0], [-3.85, 57.56, 1], [-2.95, 57.64, 1],
].map(([lon, lat, r]) => ({ at: [lon, lat], ruled: r === 1 }));

const GOLD = "#f1c74f";
const INKC = "#f4ecd8";

// A small label in map space, for place names under the big tags.
const Note: React.FC<{ x: number; y: number; text: string; opacity: number; size?: number }> = ({ x, y, text, opacity, size = 28 }) =>
  opacity <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: SERIF, fontSize: size, color: "#e2d3b0", opacity, whiteSpace: "pre", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}>{text}</div>
  );

// Tag positions per crop: the 9:16 slice is only x 517–1403, so tags sit in the sea beside Britain;
// the 16:9 frame has room to the right of the map.
const Plate: React.FC<{ x: number; y: number; w: number; h: number; opacity: number }> = ({ x, y, w, h, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 8, background: "rgba(14,11,9,0.78)", opacity }} />
);
const at = (L: Layout, v: [number, number], w: [number, number]) => (L.vertical ? { x: v[0], y: v[1] } : { x: w[0], y: w[1] });

const Pin: React.FC<{ P: Project; at: [number, number]; o: number; color?: string }> = ({ P, at: ll, o, color = INKC }) => {
  const [x, y] = P(...ll);
  return o <= 0 ? null : <circle cx={x} cy={y} r={9} fill={color} stroke="#1d1208" strokeWidth={3} opacity={o} />;
};

const MapLayer: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const o = Math.max(vis(f, SHOTS.map1), vis(f, SHOTS.map2), vis(f, SHOTS.map3), vis(f, SHOTS.map4), vis(f, SHOTS.recap));
  if (o <= 0) return null;
  const v = camAt(f);
  const P = projector(L, v);
  const [nx, ny] = P(...PLACES.northeast);
  const [sx, sy] = P(...PLACES.stonehenge);
  const [dx, dy] = P(...PLACES.dogger);
  const z = v.z;
  const inMap1 = f < SHOTS.map1[1] + 10;
  const inMap2 = f >= SHOTS.map2[0] && f < SHOTS.map2[1] + 10;
  const inMap3 = f >= SHOTS.map3[0] && f < SHOTS.map3[1] + 10;
  const inMap4 = f >= SHOTS.map4[0] && f < SHOTS.map4[1] + 10;
  const inRecap = f >= SHOTS.recap[0];
  // The region marker: a dashed ellipse, ~1.2° by ~0.9°, around the onshore Orcadian Basin.
  const rx = 1.15 * 112 * 0.58 * z * (L.vertical ? 1 : 0.75);
  const ry = 0.85 * 112 * z * (L.vertical ? 1 : 0.75);
  const region = inMap4 ? 0 : inMap1 ? ramp(f, F.scotland - 8, F.scotland + 6) : inRecap ? ramp(f, F.spot - 4, F.spot + 8) : 1;
  const unknown = inMap1 ? ramp(f, F.now, F.now + 10) : inRecap ? ramp(f, F.spot, F.spot + 10) : 0;
  // On "how", every recap route pulses together.
  const pulse = 0.75 + 0.25 * Math.sin(f / 4) * ramp(f, F.how, F.how + 8);
  const slide = ease(ramp(f, F.model + 4, F.part));
  const [ix, iy] = (() => {
    // The stone marker riding the ice path.
    const pts = ICE_PATH.map((p) => P(...p));
    const seg = Math.min(pts.length - 2, Math.floor(slide * (pts.length - 1)));
    const k = slide * (pts.length - 1) - seg;
    return [pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * k, pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * k];
  })();

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
      <Sea />
      {inMap3 ? (
        <Ink>
          <polygon points={ICE.map((p) => P(...p).join(",")).join(" ")} fill="#e8f2f7" opacity={0.28 * ramp(f, F.glacier, F.glacier + 14)} stroke="#e8f2f7" strokeWidth={2} strokeDasharray="10 8" />
        </Ink>
      ) : null}
      <Coast P={P} z={z} />
      <Ink>
        {region > 0 ? (
          <ellipse cx={nx} cy={ny} rx={rx} ry={ry} fill={unknown > 0 ? `rgba(241,199,79,${0.12 + 0.08 * Math.sin(f / 5)})` : "rgba(241,199,79,0.16)"} stroke={GOLD} strokeWidth={3} strokeDasharray="12 9" opacity={region} />
        ) : null}
        {inMap1 ? <Route P={P} pts={[PLACES.stonehenge, PLACES.northeast]} t={ease(ramp(f, F.traced + 4, F.scotland + 2))} color={GOLD} width={4} opacity={1 - unknown * 0.7} /> : null}
        {inMap2 ? (
          <>
            <Route P={P} pts={[PLACES.northeast, PLACES.stonehenge]} t={ease(ramp(f, F.travel, F.km + 6))} color={GOLD} width={5} dash="16 10" opacity={1 - 0.75 * ramp(f, F.suggested, F.suggested + 10)} />
            <Route P={P} pts={EAST} t={ease(ramp(f, F.suggested, F.suggested + 40))} color="#9fd0e0" width={4} dash="6 10" />
            <Route P={P} pts={WEST} t={ease(ramp(f, F.suggested + 6, F.suggested + 46))} color="#9fd0e0" width={4} dash="6 10" />
          </>
        ) : null}
        {inMap3 ? (
          <>
            <Route P={P} pts={ICE_PATH} t={slide} color="#e8f2f7" width={5} />
            <Route P={P} pts={PEOPLE_PATH} t={ease(ramp(f, F.part + 4, F.most + 10))} color={GOLD} width={5} dash="16 10" />
            {slide > 0 ? <rect x={ix - 17} y={iy - 6} width={34} height={12} rx={2} fill={GOLD} stroke="#1d1208" strokeWidth={2.5} /> : null}
            <Pin P={P} at={PLACES.dogger} o={ramp(f, F.model, F.model + 10)} color="#e8f2f7" />
          </>
        ) : null}
        {inMap4
          ? OUTCROPS.map((c, i) => {
              const [x, y] = P(...c.at);
              const show = ramp(f, F.many + i * 2, F.many + i * 2 + 8);
              const cross = c.ruled ? ramp(f, F.ruled + i * 2.5, F.ruled + i * 2.5 + 6) : 0;
              // No "?" on the dots left standing: the abstract names no remaining candidates.
              return (
                <g key={i} opacity={show}>
                  <circle cx={x} cy={y} r={14} fill={c.ruled && cross > 0 ? "#6b5a48" : GOLD} stroke="#1d1208" strokeWidth={3} opacity={1 - 0.4 * cross} />
                  {cross > 0 ? (
                    <g stroke="#e0503a" strokeWidth={6} strokeLinecap="round" opacity={cross}>
                      <line x1={x - 16} y1={y - 16} x2={x + 16} y2={y + 16} />
                      <line x1={x + 16} y1={y - 16} x2={x - 16} y2={y + 16} />
                    </g>
                  ) : null}
                </g>
              );
            })
          : null}
        {inRecap ? (
          <>
            <Route P={P} pts={EAST} t={ease(ramp(f, F.sea, F.sea + 24))} color="#9fd0e0" width={4} dash="6 10" opacity={pulse} />
            <Route P={P} pts={WEST} t={ease(ramp(f, F.sea + 4, F.sea + 28))} color="#9fd0e0" width={4} dash="6 10" opacity={pulse} />
            <Route P={P} pts={[PLACES.northeast, PLACES.stonehenge]} t={ease(ramp(f, F.sledge, F.sledge + 20))} color={GOLD} width={5} dash="16 10" opacity={pulse} />
            <Route P={P} pts={ICE_PATH} t={ease(ramp(f, F.ice, F.ice + 16))} color="#e8f2f7" width={5} opacity={pulse} />
            <Route P={P} pts={PEOPLE_PATH} t={ease(ramp(f, F.ice + 12, F.ice + 28))} color={GOLD} width={4} dash="8 10" opacity={0.7 * pulse} />
          </>
        ) : null}
        {!inMap4 ? <Pin P={P} at={PLACES.stonehenge} o={1} /> : null}
      </Ink>

      {unknown > 0 ? (
        <div style={{ position: "absolute", left: nx - 40, top: ny - 78, fontFamily: SERIF, fontSize: 130, color: INKC, opacity: unknown, textShadow: "0 4px 18px rgba(0,0,0,0.9)" }}>?</div>
      ) : null}
      {inRecap && unknown > 0 ? <Note x={nx + 50} y={ny - 20} text={"2024 area\ndisputed"} opacity={unknown} size={26} /> : null}
      {!inMap4 ? <Note x={sx + 18} y={sy + 6} text="Stonehenge (approx.)" opacity={1} /> : null}
      {inMap3 ? <Note x={dx - 70} y={dy + 16} text="Dogger Bank (approx.)" opacity={ramp(f, F.model, F.model + 10)} size={26} /> : null}

      {/* map1: the hook. */}
      <Tag {...at(L, [1010, 40], [1300, 140])} text="TRACED HERE" sub={"2024 · NE Scotland\n(area approx.)"} from={F.scotland} to={F.now} />
      <Tag {...at(L, [1010, 40], [1300, 140])} text="SOURCE?" sub={"2026 study questions\nNE Scotland"} from={F.exactly} to={SHOTS.map1[1]} />
      {/* map2: grain ages, distance, sea. */}
      <Tag {...at(L, [1010, 40], [1300, 140])} text="AGES MATCH" sub={"sandstone of\nNE Scotland\n(area approx.)"} from={F.sandstone + 4} to={F.ifSo} />
      <Tag {...at(L, [1090, 210], [1300, 240])} text="6 TONNES" from={F.six} to={F.suggested} />
      <Tag {...at(L, [1090, 300], [1300, 340])} text="700+ KM" sub={"if from\nNE Scotland"} from={F.seven} to={F.suggested} />
      <Tag {...at(L, [1090, 420], [1300, 420])} text="BY SEA?" sub="route not known" from={F.suggested + 10} to={SHOTS.map2[1]} />
      {/* map3: the ice model. */}
      <Tag {...at(L, [545, 640], [200, 80])} text="ICE MODEL" sub={"part of the way,\nat most"} from={F.part} to={SHOTS.map3[1]} />
      {inMap3 ? <Note {...at(L, [545, 870], [200, 860])} text="ice extent and path illustrative" opacity={ramp(f, F.glacier + 6, F.glacier + 16)} size={34} /> : null}
      {/* map4: the outcrops. */}
      <Tag {...at(L, [545, -160], [200, 80])} text="MANY RULED OUT" from={F.ruled} to={F.outcrop} />
      <Tag {...at(L, [545, -160], [200, 80])} text="NO FULL MATCH" sub={"shown in any outcrop examined\nsource unknown"} from={F.match} to={SHOTS.map4[1]} />
      {/* recap: the three proposals, none shown to be the one. */}
      <Tag {...at(L, [1090, 200], [1300, 200])} text="SEA?" sub="2024 team" from={F.sea} />
      <Tag {...at(L, [1090, 330], [1300, 330])} text="SLEDGE?" sub="2024 study" from={F.sledge} />
      <Tag {...at(L, [1090, 460], [1300, 460])} text="ICE?" sub={"2026 model:\npart of the way"} from={F.ice} />
      {inRecap ? <Note {...at(L, [545, 870], [200, 860])} text="routes illustrative" opacity={ramp(f, F.sea + 6, F.sea + 16)} size={34} /> : null}
      {inMap4 ? <Note {...at(L, [545, 880], [200, 860])} text="outcrops illustrative" opacity={ramp(f, F.many + 8, F.many + 18)} size={34} /> : null}
    </div>
  );
};

const Layer: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) =>
  o <= 0 ? null : <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>{children}</div>;

const AltarScene: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const tagL = at(L, [545, -150], [160, 60]);
  const tagL2 = at(L, [545, -20], [160, 200]);
  // The hauling shot pulls back from the front of the team to the whole line. The 9:16 slice is
  // narrow, so it starts closer and ends with the slab and the nearest haulers still filling it.
  const haulT = ease(ramp(f, SHOTS.haul[0], SHOTS.haul[1]));
  const pull = L.vertical ? 1.95 - 0.7 * haulT : 1.3 - 0.3 * haulT;

  return (
    <>
      <Layer o={vis(f, SHOTS.photo)}>
        <Photo t={ease(ramp(f, 0, SHOTS.photo[1]))} glow={0.6 + 0.4 * Math.sin(f / 12)} />
        <Credit L={L} opacity={1} />
      </Layer>

      <MapLayer L={L} f={f} />

      <Layer o={vis(f, SHOTS.grains)}>
        <Push s={1}>
          <Grains L={L} t={ramp(f, SHOTS.grains[0], SHOTS.grains[1])} zoom={ease(ramp(f, F.tiny, F.sandstone - 8))} />
        </Push>
        {/* Dark plates: the zoom fills the frame with the figure, and the credit must stay legible. */}
        <Plate {...at(L, [525, -166], [14, 44])} w={L.vertical ? 500 : 480} h={124} opacity={ramp(f, SHOTS.grains[0] + 6, SHOTS.grains[0] + 16)} />
        <Plate {...at(L, [531, 692], [456, 772])} w={370} h={86} opacity={ramp(f, SHOTS.grains[0] + 6, SHOTS.grains[0] + 16)} />
        <Tag {...at(L, [545, -150], [34, 60])} text="THE ALTAR STONE" sub={"thin sections, dated grains"} from={SHOTS.grains[0] + 6} />
        <Note {...at(L, [545, 700], [470, 780])} text={"Clarke et al. 2024, Nature\nCC BY 4.0 · cropped"} opacity={ramp(f, SHOTS.grains[0] + 6, SHOTS.grains[0] + 16)} size={30} />
      </Layer>

      <Layer o={vis(f, SHOTS.boat)}>
        <Push s={1 + 0.06 * ease(ramp(f, SHOTS.boat[0], SHOTS.boat[1])) + 0.08 * beat(f, F.boat) + 0.08 * beat(f, F.doubts)} y={-30 * beat(f, F.doubts)}>
          <Boat f={f} ghost={ramp(f, F.boat - 4, F.boat + 10)} />
        </Push>
        <Tag {...tagL} text="NO BOAT FOUND" sub="from the late Stone Age, in Britain" from={F.boat + 4} />
        <Tag {...tagL2} text="A 2024 STUDY" sub={"boats of the time: unlikely\nto carry six tonnes"} from={F.doubts + 2} />
        <FilmGrain f={f} opacity={0.12} />
      </Layer>

      <Layer o={vis(f, SHOTS.haul)}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: L.vertical ? "820px 700px" : "960px 640px", scale: `${pull}`, translate: L.vertical ? "0 -150px" : undefined }}>
          <Haul f={f - SHOTS.haul[0]} />
        </div>
        <Tag {...tagL} text="~8 MONTHS" sub="overland estimate, 2024 study" from={F.eight} />
        <Note {...at(L, [545, 880], [160, 810])} text={"illustration of a hypothesis\ncrew size not known"} opacity={ramp(f, SHOTS.haul[0] + 6, SHOTS.haul[0] + 16)} size={34} />
        <FilmGrain f={f} opacity={0.16} />
      </Layer>

      <Layer o={vis(f, SHOTS.study)}>
        <Push s={1 + 0.04 * ease(ramp(f, SHOTS.study[0], SHOTS.study[1])) + 0.05 * beat(f, F.three) + 0.08 * beat(f, F.closer)} y={60 + 80 * beat(f, F.three) + 120 * beat(f, F.closer)}>
          <Study L={L} t={ramp(f, SHOTS.study[0], SHOTS.study[1])} lens={ramp(f, F.closer - 6, F.closer + 24)} />
        </Push>
        <Tag {...at(L, [545, -170], [120, 120])} text="A NEW STUDY" sub={"three of the 2024 team\namong its authors"} from={F.three} />
        <Note {...at(L, [545, -4], [120, 300])} text={L.vertical ? "page and thin section illustrative" : "page and thin section\nillustrative"} opacity={ramp(f, SHOTS.study[0] + 6, SHOTS.study[0] + 16)} size={34} />
      </Layer>

      <LightLeak f={f} at={SHOTS.photo[1] - 6} />
      <LightLeak f={f} at={SHOTS.haul[0] + 6} />
    </>
  );
};

const Backdrop: React.FC = () => <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "#070504" }} />;

export const altarStone: Short = {
  slug: "altar-stone",
  title: "Stonehenge's Altar Stone was traced to Scotland in 2024. Scientists still can't agree where it came from",
  edit,
  looks: [{ id: "Illustrated", Set: Backdrop, cast: () => [] }],
  props: (L) => <AltarScene L={L} />,
  sfx: [
    { at: SHOTS.photo[1] - 12, name: "whoosh", volume: 0.25 },
    { at: SHOTS.haul[0], name: "whoosh", volume: 0.25 },
    { at: F.ruled, name: "thud", volume: 0.2 },
  ],
};
