// Word timings are absolute against one render of the VO. If the VO changes without the timings
// being regenerated, every beat in the edit silently drifts, so refuse to build instead.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const alignment = JSON.parse(readFileSync("src/generated/alignment.json", "utf8"));
const actual = createHash("sha256").update(readFileSync(alignment.audio)).digest("hex");

if (actual !== alignment.sha256) {
  console.error(
    `${alignment.audio} has changed since the word timings were generated ` +
      `(${actual.slice(0, 12)}, timings expect ${alignment.sha256.slice(0, 12)}).\n` +
      `Regenerate them: python3 -I tools/align.py --align`,
  );
  process.exit(1);
}
