// node --test tools/upload.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseApproval, problems, sha256, videoResource } from "./upload.mjs";

const mp4 = Buffer.from("fake video");
const meta = {
  slug: "x", file: "out/release/x.mp4", mp4_sha256: sha256(mp4), title: "T", description: "D",
  tags: [], categoryId: "28", selfDeclaredMadeForKids: false, alteredOrSyntheticContent: false,
};
const metaBuf = Buffer.from(JSON.stringify(meta));
const line = (vis = "private") => `Approve x mp4 ${sha256(mp4).slice(0, 12)} meta ${sha256(metaBuf).slice(0, 12)} as ${vis}`;

test("matching approval passes", () => {
  assert.deepEqual(problems(parseApproval(line()), metaBuf, mp4), []);
});

test("any change after approval is refused (F1)", () => {
  assert.equal(problems(parseApproval(line()), metaBuf, Buffer.from("re-rendered")).length, 2);
  const edited = Buffer.from(JSON.stringify({ ...meta, title: "New" }));
  assert.match(problems(parseApproval(line()), edited, mp4)[0], /metadata hash/);
  assert.match(problems(parseApproval(line()), metaBuf, null).at(-1), /does not exist/);
});

test("visibility comes only from the approval (F2)", () => {
  assert.equal(videoResource(meta, parseApproval(line())).status.privacyStatus, "private");
  const sched = videoResource(meta, parseApproval(line("public") + " at 2999-01-01T00:00:00Z"));
  assert.equal(sched.status.privacyStatus, "private");
  assert.equal(sched.status.publishAt, "2999-01-01T00:00:00.000Z");
  assert.throws(() => parseApproval(line("public") + " at 2000-01-01T00:00:00Z"), /future/);
  assert.throws(() => parseApproval("approve x please"), /Not an approval line/);
});
