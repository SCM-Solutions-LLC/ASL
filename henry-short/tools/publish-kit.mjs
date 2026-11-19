// Builds what a post needs from one short: the 9:16 MP4 and the text for each platform.
//
//   npm run kit -- <slug>            render, check, and write out/<slug>/
//   npm run kit -- <slug> --no-render   re-check the text against an MP4 that is already there
//
// It refuses rather than warns. A short that is still drafted has no voice, an asset without a
// licence cannot be published, and a caption over a platform's limit is truncated by the platform
// mid-word — all three are cheaper to catch here than after the upload. See docs/publishing.md.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const render = !args.includes("--no-render");
const fail = (msg) => {
  console.error(`kit: ${msg}`);
  process.exit(1);
};

if (!slug) fail("Usage: npm run kit -- <slug> [--no-render]");

const dir = `src/shorts/${slug}`;
const entry = [`${dir}/index.tsx`, `${dir}/index.ts`].find(existsSync);
if (!entry) fail(`no short at ${dir}`);

// A drafted short has estimated timings and no audio. It previews; it does not ship.
const source = readdirSync(dir).map((f) => readFileSync(`${dir}/${f}`, "utf8")).join("\n");
if (source.includes("makeDraftEdit")) fail(`${slug} is still drafted (makeDraftEdit). Record it: npm run tts -- ${slug}`);

const metaPath = `publish/${slug}.json`;
if (!existsSync(metaPath)) fail(`${metaPath} is missing — the post text is written and reviewed with the short, not at upload time`);
const meta = JSON.parse(readFileSync(metaPath, "utf8"));

// Limits as the platforms enforce them. TikTok's is the one the Higgsfield publish tool accepts
// for a title; YouTube's title is 100 and a Short needs no #Shorts tag but is found faster with one.
const LIMITS = { tiktok: 150, youtubeTitle: 100, youtubeDescription: 5000, instagram: 2200 };
const tags = (list) => list.map((t) => `#${t}`).join(" ");
for (const [k, list] of Object.entries(meta.hashtags)) {
  const badTag = list.find((t) => !/^[A-Za-z0-9_]+$/.test(t));
  if (badTag) fail(`${metaPath}: hashtag "${badTag}" (${k}) — letters, digits and underscores only, no #`);
}
if (meta.hashtags.instagram.length > 5) fail(`${metaPath}: Instagram gets at most 5 hashtags here; more reads as spam and is not rewarded`);

const text = {
  tiktok: `${meta.caption} ${tags(meta.hashtags.tiktok)}`,
  youtubeTitle: meta.title,
  youtubeDescription: `${meta.description}\n\nSources:\n${meta.sources.map((s) => `- ${s}`).join("\n")}\n\n${tags(meta.hashtags.youtube)}`,
  instagram: `${meta.caption}\n\n${meta.description}\n\n${tags(meta.hashtags.instagram)}`,
};
for (const [k, max] of Object.entries(LIMITS)) if (text[k].length > max) fail(`${metaPath}: ${k} text is ${text[k].length} characters, limit ${max}`);
if (!meta.sources?.length) fail(`${metaPath}: no sources — a factual short is posted with where its numbers came from`);

const run = (cmd, a) => execFileSync(cmd, a, { stdio: "inherit" });
if (render) {
  run("npm", ["run", "--silent", "lint"]);
  run("npm", ["run", "--silent", "publishable"]);
}

const out = `out/${slug}`;
mkdirSync(out, { recursive: true });
const mp4 = `${out}/${slug}_9x16.mp4`;
const comp = `${slug}-${meta.look}`;
if (render) run("npx", ["remotion", "render", comp, mp4, "--log=error"]);
if (!existsSync(mp4)) fail(`${mp4} does not exist — run without --no-render`);

// Check the file that will actually be uploaded, not the composition that was meant to make it.
const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", mp4], { encoding: "utf8" }),
);
const video = probe.streams.find((s) => s.codec_type === "video");
const audio = probe.streams.find((s) => s.codec_type === "audio");
const seconds = Number(probe.format.duration);
if (!video || video.width !== 1080 || video.height !== 1920) fail(`${mp4} is ${video?.width}x${video?.height}, expected 1080x1920`);
if (!audio) fail(`${mp4} has no audio track`);
// Three minutes is where YouTube stops treating a vertical video as a Short; TikTok and Reels
// both take longer, so it is the binding limit for a file posted to all three.
if (seconds < 3 || seconds > 180) fail(`${mp4} runs ${seconds.toFixed(1)}s; a Short on all three platforms is 3–180s`);

writeFileSync(
  `${out}/post.md`,
  `# ${meta.title}

File: \`${mp4}\` — ${seconds.toFixed(1)}s, ${video.width}x${video.height}, ${(Number(probe.format.size) / 1e6).toFixed(1)} MB
Script and sources: \`script/${meta.script ?? slug}.txt\`

## TikTok (${text.tiktok.length}/${LIMITS.tiktok})

${text.tiktok}

## YouTube Shorts

Title (${text.youtubeTitle.length}/${LIMITS.youtubeTitle}): ${text.youtubeTitle}

${text.youtubeDescription}

## Instagram Reels (${text.instagram.length}/${LIMITS.instagram})

${text.instagram}
`,
);
console.log(`kit: ${mp4} (${seconds.toFixed(1)}s) and ${out}/post.md are ready for review`);
