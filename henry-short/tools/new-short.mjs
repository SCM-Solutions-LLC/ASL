// Scaffolds a short: the three files one needs, filled in enough to render something.
// Run: npm run new-short -- <slug> [vo-slug]
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const [slug, vo = "six-wives"] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: npm run new-short -- <slug> [vo-slug]   (slug is lower-case-with-dashes)");
  process.exit(1);
}

const dir = `src/shorts/${slug}`;
if (existsSync(dir)) {
  console.error(`${dir} already exists.`);
  process.exit(1);
}

const camel = slug.replace(/-(.)/g, (_, c) => c.toUpperCase());
const Title = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

mkdirSync(dir, { recursive: true });

writeFileSync(`${dir}/set.tsx`, `import React from "react";

// The set, in stage units. Draw it wider and taller than 16:9 so the vertical crop never runs out.
export const Set: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: -400, right: -400, top: -500, height: 1360, background: "linear-gradient(#2a2118, #4a3c2a)" }} />
    <div style={{ position: "absolute", left: -400, right: -400, top: 820, height: 800, background: "linear-gradient(#5a4a32, #1a140c 60%)" }} />
  </>
);
`);

writeFileSync(`${dir}/cast.ts`, `import { drawnActor } from "../../chars/actors";
import { figure, figureRest } from "../../chars/figure";

// A new figure is a palette and a silhouette: the shape is what a viewer recognises at thumbnail
// size. Joints, faces and every move come from the shared spec.
export const lead = drawnActor(
  "${camel}",
  figure({ gown: "#6b2535", trim: "#d8a93b", skin: "#f3d2b3", hair: "#3b2416", headwear: "hood" }),
  figureRest,
);
`);

writeFileSync(`${dir}/index.tsx`, `import { Easing, interpolate } from "remotion";
import { makeEdit } from "../../edit";
import { bob, relax, settle } from "../../moves";
import { bind } from "../../rig/cast";
import { TitleCard } from "../../ui/Callouts";
import alignment from "../../generated/${vo}.alignment.json";
import type { Short } from "../types";
import { lead } from "./cast";
import { Set } from "./set";

// Name the slices of the VO by what is spoken, never by source frame: regenerating the audio then
// re-resolves the cut instead of breaking it.
const edit = makeEdit({
  alignment,
  cut: [{ from: "FIRST WORDS HERE", to: "LAST WORDS HERE.", tail: 0.2 }],
  keyPhrases: [],
});

// Every beat hangs off a spoken word, so a re-cut VO keeps the animation in sync.
const F = {
  open: edit.at("FIRST"),
  voEnd: edit.voEnd,
};

const a = bind(lead);

export const ${camel}: Short = {
  slug: "${slug}",
  title: "${Title}",
  edit,
  looks: [
    {
      id: "Illustrated",
      Set,
      cast: (L) => [
        {
          actor: lead,
          mark: L.marks.anne,
          keys: [...settle(a, 0), ...bob(a, F.open), ...relax(a, F.voEnd - 10)],
        },
      ],
    },
  ],
  ui: () => <TitleCard from={F.open} to={F.open + 60} kicker="KICKER" title="${Title.toUpperCase()}" />,
  camera: {
    zoom: (f) => interpolate(f, [0, F.voEnd], [1, 1.06], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) }),
  },
  sfx: [],
};
`);

console.log(`Scaffolded ${dir}

Next:
  1. Fill in the cut anchors in ${dir}/index.tsx with what is actually spoken.
  2. Add it to src/shorts/index.ts:  import { ${camel} } from "./${slug}";  and list it in SHORTS.
  3. npx remotion studio

If this short needs its own VO, put the script at script/<vo>.txt and the audio at
public/vo/<vo>.wav, run \`npm run align -- <vo>\`, and point the import at it.`);
