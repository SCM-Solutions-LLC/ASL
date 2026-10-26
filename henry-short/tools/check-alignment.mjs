// Word timings are absolute against one render of a VO. If the VO changes without the timings
// being regenerated, every beat in that short silently drifts, so refuse to build instead.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

const DIR = "src/generated";
let bad = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".alignment.json"))) {
  const slug = file.replace(".alignment.json", "");
  const alignment = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  const actual = createHash("sha256").update(readFileSync(alignment.audio)).digest("hex");
  if (actual !== alignment.sha256) {
    console.error(
      `${alignment.audio} has changed since ${slug}'s word timings were generated ` +
        `(${actual.slice(0, 12)}, timings expect ${alignment.sha256.slice(0, 12)}).\n` +
        `Regenerate them: npm run align -- ${slug}`,
    );
    bad++;
  }
}

if (bad) process.exit(1);
