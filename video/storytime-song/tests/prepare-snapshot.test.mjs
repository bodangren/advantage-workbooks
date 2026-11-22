import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT, prepare } from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, "../../..");
const RUNS = path.join(REPO, "measure/runs/storytime_song_video_20261022");
const FIXTURE = path.join(HERE, "fixtures/w01-spec-1ffd649b.json");
const FIXTURE_FULL = path.join(HERE, "fixtures/w01-prepare-spec-1ffd649b.json");
const THAI = /[\u0e00-\u0e7f]/;

function stripThai(value) {
  if (Array.isArray(value)) return value.map(stripThai);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "th" || THAI.test(k)) continue;
      out[k] = stripThai(v);
    }
    return out;
  }
  if (typeof value === "string") return THAI.test(value) ? "" : value;
  return value;
}

test("A-note the week 1 guard covers prepare.mjs output, not only compositor sources", () => {
  assert.ok(!FIXTURE.includes("video/measure"), "fixture must live under repo tests/fixtures");
  const raw = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  assert.equal(raw.generated_from, "git show 1ffd649b:video/storytime-song/scripts/prepare.mjs", "fixture must name the phase-base source");
  assert.equal(raw.week, "l2/w01", "fixture must cover week 1");
  const week = stripThai(JSON.parse(fs.readFileSync(path.join(CONTENT, "l2/w01.json"), "utf8")));
  const spec = buildSpec(week, raw.duration);
  assert.deepEqual(spec, raw.spec, "a prepare change that alters week 1 must fail here");
  console.log(`Snapshot spec line count: ${spec.lines.length}`);
  const fileBytes = fs.readFileSync(FIXTURE);
  assert.ok(!THAI.test(fileBytes.toString("utf8")), "fixture must hold 0 Thai characters");
  const fileHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
  console.log(`Snapshot fixture sha256: ${fileHash}`);
  const evidence = path.join(RUNS, "green-p1-w01-compare.txt");
  assert.ok(fs.existsSync(evidence), "missing week 1 compare evidence");
  const text = fs.readFileSync(evidence, "utf8");
  const line = text.match(/^prepare snapshot spec sha256: ([0-9a-f]+)$/m);
  assert.ok(line, "evidence must carry a labeled prepare snapshot spec sha256 line (Red r3 A-note)");
  assert.equal(line[1].length, 64, "snapshot hash must hold 64 hex chars");
  assert.equal(line[1], fileHash, "evidence snapshot hash must match the fixture file");
});

test("A-note2 prepare full week 1 output equals the phase base", () => {
  const spec = JSON.parse(fs.readFileSync(prepare("l2/w01"), "utf8"));
  const fixture = JSON.parse(fs.readFileSync(FIXTURE_FULL, "utf8"));
  assert.deepEqual(spec, fixture.spec, "a prepare change that alters week 1 must fail here (Red r6)");
  const fileBytes = fs.readFileSync(FIXTURE_FULL);
  const fileHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
  console.log(`Full prepare fixture sha256: ${fileHash}`);
  const evidence = path.join(RUNS, "green-p1-w01-compare.txt");
  assert.ok(fs.existsSync(evidence), "missing week 1 compare evidence");
  const text = fs.readFileSync(evidence, "utf8");
  const line = text.match(/^prepare full w01 spec sha256: ([0-9a-f]+)$/m);
  assert.ok(line, "evidence must carry a labeled prepare full w01 spec sha256 line (Red r6)");
  assert.equal(line[1].length, 64, "full spec hash must hold 64 hex chars");
  assert.equal(line[1], fileHash, "evidence full spec hash must match the fixture file");
  assert.ok(/^base stills source: base-tree prepare output and base-tree public assets$/m.test(text), "evidence must record the base-tree prepare methodology (Red r6)");
});
