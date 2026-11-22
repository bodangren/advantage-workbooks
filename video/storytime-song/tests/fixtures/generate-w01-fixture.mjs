#!/usr/bin/env node
// Generates tests/fixtures/w01-spec-1ffd649b.json from the phase-base prepare.mjs.
// Usage: node tests/fixtures/generate-w01-fixture.mjs
// The fixture input is the Thai-stripped l2/w01.json (English-only). Both the
// phase-base and the current buildSpec read only English fields, so the strip
// keeps the comparison exact while the fixture holds 0 Thai characters.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const THAI = /[\u0E00-\u0e7f]/;
const BASE_SHA = "1ffd649b";
const DURATION = 85.37;

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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "w01-base-"));
const basePrepare = execFileSync("git", ["show", `${BASE_SHA}:video/storytime-song/scripts/prepare.mjs`], { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 20 });
const baseForge = execFileSync("git", ["show", `${BASE_SHA}:video/storytime-song/scripts/forge.mjs`], { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 20 });
fs.writeFileSync(path.join(tmp, "prepare-base.mjs"), basePrepare);
fs.writeFileSync(path.join(tmp, "forge.mjs"), baseForge);
const week = stripThai(JSON.parse(fs.readFileSync(path.join(REPO, "content/storytime/l2/w01.json"), "utf8")));
const { buildSpec } = await import(path.join(tmp, "prepare-base.mjs"));
const spec = buildSpec(week, DURATION);
const fixture = {
  generated_from: `git show ${BASE_SHA}:video/storytime-song/scripts/prepare.mjs`,
  week: "l2/w01",
  duration: DURATION,
  thai_stripped_input: true,
  spec,
};
const out = path.join(HERE, "w01-spec-1ffd649b.json");
fs.writeFileSync(out, JSON.stringify(fixture, null, 1) + "\n");
const bytes = fs.readFileSync(out);
if (THAI.test(bytes.toString("utf8"))) throw new Error("fixture holds Thai");
console.log(`Fixture week input line count: ${week.song.lines.length}`);
console.log(`Fixture spec line count: ${spec.lines.length}`);
console.log(`Fixture spec sha256: ${crypto.createHash("sha256").update(bytes).digest("hex")}`);
fs.rmSync(tmp, { recursive: true, force: true });
