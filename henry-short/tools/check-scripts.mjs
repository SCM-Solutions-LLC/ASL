// A drafted short carries its script twice: inline, where makeDraftEdit estimates timings from it,
// and in script/<slug>.txt, which is what `npm run tts` speaks. If those drift, the voice says one
// thing and every beat is keyed to another — silently. So refuse to build instead.
//
// The duplication is temporary. Once a short has a real voice-over it reads the generated
// alignment and the inline copy goes away, at which point it stops being checked here.
import { readFileSync, readdirSync, existsSync } from "node:fs";

const SHORTS = "src/shorts";
const words = (t) => t.split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z0-9']/g, "")).filter(Boolean);
let bad = 0;

for (const slug of readdirSync(SHORTS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const entry = [`${SHORTS}/${slug}/index.tsx`, `${SHORTS}/${slug}/index.ts`].find(existsSync);
  if (!entry) continue;
  const source = readFileSync(entry, "utf8");
  if (!source.includes("makeDraftEdit")) continue;

  const inline = source.match(/const SCRIPT = `([^`]*)`/);
  if (!inline) {
    console.error(`${entry} uses makeDraftEdit but has no \`const SCRIPT = \`...\`\` to check.`);
    bad++;
    continue;
  }
  const file = `script/${slug}.txt`;
  if (!existsSync(file)) {
    console.error(`${entry} drafts from an inline script, but ${file} does not exist — \`npm run tts -- ${slug}\` would fail.`);
    bad++;
    continue;
  }
  // tools/tts.py speaks only the part above a `---` sources block.
  const spoken = readFileSync(file, "utf8").split("\n---\n")[0];
  const a = words(inline[1]);
  const b = words(spoken);
  if (a.join(" ") === b.join(" ")) continue;

  const at = a.findIndex((w, i) => w !== b[i]);
  console.error(
    `${entry} and ${file} do not say the same thing: ${a.length} words inline, ${b.length} in the script, ` +
      `first difference at word ${at + 1} (${a.slice(at, at + 4).join(" ")} vs ${b.slice(at, at + 4).join(" ")}).\n` +
      `Make them match — the voice-over is spoken from the file, and the beats are keyed to the inline copy.`,
  );
  bad++;
}

if (bad) process.exit(1);
console.log("scripts: drafted shorts match their script files");
