import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { prepare, prepareWithManifest, resolveActorArt, usedArt } from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, "../../..");
const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";
const FIXTURE_FULL = path.join(HERE, "fixtures/w01-prepare-spec-1ffd649b.json");
const THAI = /[\u0e00-\u0e7f]/;

function handoffFiles() {
  const tsv = fs.readFileSync(path.join(HANDOFF, "MANIFEST.tsv"), "utf8");
  return tsv.trim().split("\n").slice(1).map((ln) => ln.split("\t")[0]);
}

test("A-F6 prepare works without the handoff and keeps week 1 approved", () => {
  const src = fs.readFileSync(path.resolve(HERE, "../scripts/prepare.mjs"), "utf8");
  assert.ok(src.includes("STORYTIME_SONG_ART_DIR"), "handoff path must be injectable via STORYTIME_SONG_ART_DIR (Red r6 A-F6)");
  const prev = process.env.STORYTIME_SONG_ART_DIR;
  process.env.STORYTIME_SONG_ART_DIR = path.join(os.tmpdir(), "no-such-handoff-dir");
  try {
    const spec = JSON.parse(fs.readFileSync(prepare("l2/w04"), "utf8"));
    assert.equal(spec.art, "placeholder", "without the handoff every actor keeps the placeholder");
    assert.ok(!spec.forge, "no Forge art without the handoff");
    for (const name of usedArt(spec).actors) {
      assert.equal(resolveActorArt(name, spec.forge).kind, "placeholder", `${name} must resolve to a placeholder`);
    }
    const w01 = JSON.parse(fs.readFileSync(prepare("l2/w01"), "utf8"));
    const fixture = JSON.parse(fs.readFileSync(FIXTURE_FULL, "utf8"));
    assert.deepEqual(w01, fixture.spec, "week 1 output must equal the phase base");
  } finally {
    if (prev === undefined) delete process.env.STORYTIME_SONG_ART_DIR;
    else process.env.STORYTIME_SONG_ART_DIR = prev;
  }
});

test("A-F7 the production copy verifies each file against its manifest row", () => {
  const sceneManifest = path.join(HANDOFF, "scenes/w04/manifest.json");
  const names = ["pat", "sam", "mia", "may"];
  const realRows = fs.readFileSync(path.join(HANDOFF, "MANIFEST.tsv"), "utf8").trim().split("\n").slice(1);
  const shaOf = (rel) => {
    const row = realRows.find((ln) => ln.split("\t")[0] === rel);
    assert.ok(row, `no manifest row for ${rel}`);
    return row.split("\t")[3];
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "w02-badsha-"));
  fs.mkdirSync(path.join(tmp, "scenes/w04"), { recursive: true });
  fs.copyFileSync(sceneManifest, path.join(tmp, "scenes/w04/manifest.json"));
  const lines = ["file\tcharacter_or_week\tsource_commit\tsha256"];
  for (const name of names) {
    const rel = `cutouts/${name}/listen.png`;
    fs.mkdirSync(path.join(tmp, `cutouts/${name}`), { recursive: true });
    fs.copyFileSync(path.join(HANDOFF, rel), path.join(tmp, rel));
    let sha = shaOf(rel);
    if (name === "pat") sha = sha.slice(0, -1) + (sha.endsWith("0") ? "1" : "0");
    lines.push(`${rel}\t${name}\t65e233fb\t${sha}`);
  }
  fs.writeFileSync(path.join(tmp, "MANIFEST.tsv"), lines.join("\n") + "\n");
  assert.throws(() => prepareWithManifest("l2/w02", tmp), /sha256|hash|mismatch|integrity|digest|corrupt/i, "production copy must fail on a manifest hash mismatch (Red r6 A-F7)");
  fs.rmSync(tmp, { recursive: true, force: true });
});
