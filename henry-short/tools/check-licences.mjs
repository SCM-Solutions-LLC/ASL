// Nothing ships without a recorded licence.
//
// The project already lost a complete voice-over to a licence nobody checked before generating
// it, and that cost cannot be undone after the fact. So every file under public/ has to be
// declared in public/SOURCES.json, and the declaration has to say whether it may be published.
//
//   node tools/check-licences.mjs            part of `npm run lint` — fails on an undeclared file
//   node tools/check-licences.mjs --publish  fails while anything unpublishable is still in the tree
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "public";
const MANIFEST = join(ROOT, "SOURCES.json");
const publishMode = process.argv.includes("--publish");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const rules = Object.entries(manifest).filter(([k]) => !k.startsWith("_"));

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

// Only `*` is supported, and it does not cross a directory boundary — enough for "every wav in
// this folder" without pulling in a glob dependency for one file.
const matches = (pattern, path) => {
  const rx = new RegExp(`^${pattern.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")}$`);
  return rx.test(path);
};

const files = walk(ROOT).filter((f) => f !== MANIFEST);
const undeclared = [];
const blocked = [];

for (const file of files) {
  const hit = rules.find(([pattern]) => matches(pattern, file));
  if (!hit) {
    undeclared.push(file);
    continue;
  }
  const [, entry] = hit;
  if (entry.ship === false) blocked.push([file, entry]);
}

if (undeclared.length) {
  console.error(
    `${undeclared.length} file(s) under ${ROOT}/ have no entry in ${MANIFEST}:\n` +
      undeclared.map((f) => `  ${f}`).join("\n") +
      `\n\nAdd each one with its source, its licence, and whether it may be published.`,
  );
  process.exit(1);
}

if (blocked.length) {
  const reasons = [...new Set(blocked.map(([, e]) => e.note ?? e.licence))];
  const lines =
    `${blocked.length} asset(s) in ${ROOT}/ are NOT CLEARED FOR PUBLISHING:\n` +
    blocked.map(([f, e]) => `  ${f}  (${e.licence})`).join("\n") +
    `\n\n` +
    reasons.map((r) => `  - ${r}`).join("\n");
  if (publishMode) {
    console.error(`${lines}\n\nRefusing to call this publishable.`);
    process.exit(1);
  }
  // During development this is a standing reminder, not a failure: a permanently red lint gets ignored.
  console.warn(`${lines}\n`);
}

console.log(`licences: ${files.length} file(s) declared${blocked.length ? `, ${blocked.length} blocked for publish` : ", all clear to publish"}`);
