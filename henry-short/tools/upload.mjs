// GUARDRAILS F1–F3, enforced: uploads one short to YouTube only against the owner's approval line,
// and only if the MP4 and review/<slug>.json still hash to what was approved.
//
//   node tools/upload.mjs "Approve <slug> mp4 <hex> meta <hex> as private" --dry-run
//   node tools/upload.mjs "Approve <slug> mp4 <hex> meta <hex> as public at 2026-11-20T15:00:00Z"
//
// "as <visibility> at <ISO time>" schedules: YouTube needs privacyStatus private + publishAt for that.
// Credentials (F3): a JSON file with client_id, client_secret, refresh_token for a YouTube OAuth
// client with the youtube.upload scope, at $YT_CREDENTIALS (default ~/.config/henry-short/youtube.json).
// It is read only on a real upload and nothing from it is printed.
//
// shortcut: one PUT of the whole file, no resume after a dropped connection; fine at Shorts sizes,
// add chunked resume if uploads start failing midway.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const LINE =
  /^Approve ([a-z0-9-]+) mp4 ([0-9a-f]{12,64}) meta ([0-9a-f]{12,64}) as (private|unlisted|public)(?: at (\S+))?$/;

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

export function parseApproval(line) {
  const m = LINE.exec(line.trim());
  if (!m) throw new Error(`Not an approval line: "${line}". Expected: Approve <slug> mp4 <hex> meta <hex> as <private|unlisted|public> [at <ISO time>]`);
  const [, slug, mp4, meta, visibility, at] = m;
  if (at && !(Date.parse(at) > Date.now())) throw new Error(`Schedule "${at}" is not a future ISO time.`);
  return { slug, mp4, meta, visibility, at };
}

// Everything that must hold before a byte leaves the machine. Returns a list of problems.
export function problems(approval, metaBuf, mp4Buf) {
  const out = [];
  const metaHash = sha256(metaBuf);
  if (!metaHash.startsWith(approval.meta)) out.push(`metadata hash ${metaHash.slice(0, 12)} is not the approved ${approval.meta} (F1).`);
  const meta = JSON.parse(metaBuf);
  if (meta.slug !== approval.slug) out.push(`metadata is for "${meta.slug}", approval is for "${approval.slug}".`);
  if (!mp4Buf) return [...out, `${meta.file} does not exist.`];
  const mp4Hash = sha256(mp4Buf);
  if (!mp4Hash.startsWith(approval.mp4)) out.push(`MP4 hash ${mp4Hash.slice(0, 12)} is not the approved ${approval.mp4} (F1).`);
  if (mp4Hash !== meta.mp4_sha256) out.push(`MP4 hash does not match mp4_sha256 in the metadata.`);
  if (meta.selfDeclaredMadeForKids !== false) out.push(`selfDeclaredMadeForKids must be false (E1).`);
  if (!meta.title || meta.title.length > 100) out.push(`title must be 1–100 characters.`);
  if (Buffer.byteLength(meta.description) > 5000) out.push(`description is over 5000 bytes.`);
  if (/[<>]/.test(meta.title + meta.description)) out.push(`YouTube rejects < or > in title/description.`);
  return out;
}

export function videoResource(meta, approval) {
  const status = {
    privacyStatus: approval.at ? "private" : approval.visibility,
    selfDeclaredMadeForKids: false,
    containsSyntheticMedia: meta.alteredOrSyntheticContent,
  };
  if (approval.at) status.publishAt = new Date(approval.at).toISOString();
  const { title, description, tags, categoryId } = meta;
  return { snippet: { title, description, tags, categoryId }, status };
}

async function accessToken() {
  const path = process.env.YT_CREDENTIALS || `${homedir()}/.config/henry-short/youtube.json`;
  if (!existsSync(path)) throw new Error(`No credentials at ${path} (see the header of this file).`);
  const { client_id, client_secret, refresh_token } = JSON.parse(readFileSync(path, "utf8"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: HTTP ${res.status}.`); // body may echo secrets
  return (await res.json()).access_token;
}

async function upload(resource, mp4Buf) {
  const auth = { Authorization: `Bearer ${await accessToken()}` };
  const start = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(mp4Buf.length),
      },
      body: JSON.stringify(resource),
    },
  );
  if (!start.ok) throw new Error(`Upload start failed: HTTP ${start.status} ${await start.text()}`);
  const put = await fetch(start.headers.get("location"), {
    method: "PUT",
    headers: { ...auth, "Content-Type": "video/mp4" },
    body: mp4Buf,
  });
  if (!put.ok) throw new Error(`Upload failed: HTTP ${put.status} ${await put.text()}`);
  return put.json();
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry-run");
  const approval = parseApproval(args.filter((a) => a !== "--dry-run").join(" "));
  const metaPath = `review/${approval.slug}.json`;
  if (!existsSync(metaPath)) throw new Error(`${metaPath} does not exist.`);
  const metaBuf = readFileSync(metaPath);
  const meta = JSON.parse(metaBuf);
  const mp4Buf = existsSync(meta.file) ? readFileSync(meta.file) : null;

  const found = problems(approval, metaBuf, mp4Buf);
  if (found.length) {
    console.error(`Refusing to upload ${approval.slug}:\n- ${found.join("\n- ")}`);
    process.exit(1);
  }
  const resource = videoResource(meta, approval);
  console.log(`${approval.slug}: hashes match the approval. Request body:\n${JSON.stringify(resource, null, 2)}`);
  if (dry) return console.log("Dry run: nothing uploaded.");

  const video = await upload(resource, mp4Buf);
  const record = `review/${approval.slug}.upload.json`;
  writeFileSync(record, JSON.stringify({
    slug: approval.slug,
    videoId: video.id,
    mp4_sha256: meta.mp4_sha256,
    meta_sha256: sha256(metaBuf),
    status: video.status,
    uploadedAt: new Date().toISOString(),
  }, null, 2) + "\n");
  console.log(`Uploaded: https://youtu.be/${video.id} (${video.status.privacyStatus}). Recorded in ${record}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
