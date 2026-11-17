// GUARDRAILS A1 and A7, enforced: no voice-over ships until a separate fact-check pass has confirmed
// every claim in its script, and that confirmation describes the script as it is now.
//
// The pass itself is run by the fact-check skill (.claude/skills/fact-check/SKILL.md) and writes
// factcheck/<vo>.json. This only refuses to call a VO publishable while that report is missing,
// stale (the script changed after it was checked) or holds any claim that is not "confirmed".
//
//   node tools/check-factcheck.mjs              every script/*.txt
//   node tools/check-factcheck.mjs six-wives    just these VOs
//
// shortcut: the report hashes the script file only, so an on-screen label edited after the check
// is not caught here; hash each short's index.tsx too if that starts to happen.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const vos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync("script").filter((f) => f.endsWith(".txt")).map((f) => f.slice(0, -4));

const problems = [];
for (const vo of vos) {
  const script = `script/${vo}.txt`;
  const report = `factcheck/${vo}.json`;
  if (!existsSync(script)) {
    problems.push(`${vo}: ${script} does not exist.`);
    continue;
  }
  const text = readFileSync(script, "utf8");
  if (!text.includes("\n---\n")) {
    problems.push(`${vo}: ${script} has no --- SOURCES block (A1). Source every claim before fact-checking.`);
    continue;
  }
  if (!existsSync(report)) {
    problems.push(`${vo}: no ${report}. Run the fact-check skill on it (A7).`);
    continue;
  }
  const r = JSON.parse(readFileSync(report, "utf8"));
  const sha = createHash("sha256").update(text).digest("hex");
  if (r.sha256 !== sha) {
    problems.push(`${vo}: ${report} checked a different version of ${script}. Re-run the fact-check.`);
    continue;
  }
  if (!Array.isArray(r.claims) || r.claims.length === 0) {
    problems.push(`${vo}: ${report} lists no claims.`);
    continue;
  }
  for (const c of r.claims.filter((c) => c.verdict !== "confirmed")) {
    problems.push(`${vo}: claim ${c.n} is "${c.verdict}": ${c.claim}${c.note ? ` — ${c.note}` : ""}`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`factcheck: ${vos.length} voice-over(s) confirmed against their current scripts`);
