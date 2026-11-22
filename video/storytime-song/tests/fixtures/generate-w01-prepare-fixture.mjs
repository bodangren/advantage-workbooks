#!/usr/bin/env node
// Generates tests/fixtures/w01-prepare-spec-1ffd649b.json from the phase-base prepare.
// Usage: node tests/fixtures/generate-w01-prepare-fixture.mjs
// The fixture runs git show 1ffd649b:video/storytime-song/scripts/prepare.mjs in a
// scratch tree that symlinks the current content folder, calls prepare("l2/w01"),
// and stores the resulting spec. The spec holds only English strings and numbers,
// so the fixture holds 0 Thai characters.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const THAI = /[\u0e00-\u0e7f]/;
const BASE_SHA = "1ffd649b";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "w01-base-prepare-"));
const scriptsDir = path.join(tmp, "video/storytime-song/scripts");
fs.mkdirSync(scriptsDir, { recursive: true });
for (const name of ["prepare.mjs", "forge.mjs"]) {
  const src = execFileSync("git", ["show", `${BASE_SHA}:video/storytime-song/scripts/${name}`], { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 20 });
  fs.writeFileSync(path.join(scriptsDir, name), src);
}
const contentLink = path.join(tmp, "content");
if (!fs.existsSync(contentLink)) fs.symlinkSync(path.join(REPO, "content"), contentLink);
const { prepare } = await import(path.join(scriptsDir, "prepare.mjs"));
const specFile = prepare("l2/w01");
const spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
const fixture = {
  generated_from: `git show ${BASE_SHA}:video/storytime-song/scripts/prepare.mjs prepare("l2/w01")`,
  week: "l2/w01",
  spec,
};
const out = path.join(HERE, "w01-prepare-spec-1ffd649b.json");
fs.writeFileSync(out, JSON.stringify(fixture, null, 1) + "\n");
const bytes = fs.readFileSync(out);
if (THAI.test(bytes.toString("utf8"))) throw new Error("fixture holds Thai");
if (JSON.stringify(spec).match(/\/tmp\//)) throw new Error("fixture leaks the tmp tree");
console.log(`Fixture spec line count: ${spec.lines.length}`);
console.log(`Fixture art: ${spec.art}`);
console.log(`Fixture cast: ${Object.keys(spec.forge?.cast ?? {}).sort().join(",")}`);
console.log(`Fixture gestures: ${Object.keys(spec.forge?.gestures ?? {}).sort().join(",")}`);
console.log(`Fixture spec sha256: ${crypto.createHash("sha256").update(bytes).digest("hex")}`);
fs.rmSync(tmp, { recursive: true, force: true });
