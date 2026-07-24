import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, ROOT), "utf8");
}

test("source models are valid GitHub-sized GLB files", async () => {
  for (const name of [
    "newton-ring-source.glb",
    "travelling-microscope-source.glb",
  ]) {
    const url = new URL(`assets/models/source/${name}`, ROOT);
    const info = await stat(url);
    const header = await readFile(url);
    assert.equal(header.subarray(0, 4).toString("ascii"), "glTF");
    assert.ok(info.size < 100 * 1024 * 1024, `${name} exceeds 100 MB`);
  }
});

test("page exposes only the microscope viewer", async () => {
  const html = await read("index.html");
  assert.doesNotMatch(html, /id="newton-viewer"/);
  assert.match(html, /id="microscope-viewer"/);
  assert.equal((html.match(/data-action="reset"/g) ?? []).length, 1);
  assert.match(html, /src\/main\.js/);
  assert.match(html, /window\.addEventListener\("error"/);
  assert.match(html, /window\.addEventListener\("unhandledrejection"/);
});

test("textured microscope and replacement clip assets are publishable GLBs", async () => {
  for (const name of [
    "travelling-microscope-textured.glb",
    "stage-clip-source.glb",
  ]) {
    const url = new URL(`assets/models/source/${name}`, ROOT);
    const info = await stat(url);
    const header = await readFile(url);
    assert.equal(header.subarray(0, 4).toString("ascii"), "glTF");
    assert.ok(info.size < 100 * 1024 * 1024, `${name} exceeds 100 MB`);
  }
});

test("silver rail texture is a publishable JPEG", async () => {
  for (const name of [
    "tripo-part-1-silver.jpg",
    "tripo-part-16-silver.jpg",
  ]) {
    const bytes = await readFile(new URL(
      `assets/textures/microscope/${name}`,
      ROOT,
    ));
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);
    assert.ok(bytes.length > 1000, `${name} is too small`);
  }
});

test("main module loads only the supplied microscope model", async () => {
  const source = await read("src/main.js");
  assert.match(source, /travelling-microscope-textured\.glb/);
  assert.match(source, /stage-clip-source\.glb/);
  assert.match(source, /replaceTexturedStageClips/);
  assert.match(source, /tripo-part-16-silver\.jpg/);
  assert.match(source, /tripo-part-1-silver\.jpg/);
  assert.match(source, /applyMicroscopeSurfaceCorrections/);
  assert.match(source, /loadColorTexture/);
  assert.doesNotMatch(source, /createMicroscopeMaterials/);
  assert.doesNotMatch(source, /applyMicroscopeMaterials/);
  assert.doesNotMatch(source, /newton-ring-clean\.glb/);
  assert.doesNotMatch(source, /createMicroscopeLowerAssembly/);
  assert.doesNotMatch(source, /diagnosticMaterials/);
});

test("viewer uses filmic tone mapping to preserve metal detail", async () => {
  const source = await read("src/viewer.js");
  assert.match(source, /renderer\.toneMapping\s*=\s*THREE\.ACESFilmicToneMapping/);
  assert.match(source, /renderer\.toneMappingExposure\s*=\s*0\.9/);
  assert.match(source, /await onLoaded\?\./);
});

test("vendored Three.js modules include their browser dependencies", async () => {
  for (const path of [
    "vendor/three/three.core.js",
    "vendor/utils/BufferGeometryUtils.js",
  ]) {
    const info = await stat(new URL(path, ROOT));
    assert.ok(info.size > 0, `${path} is empty`);
  }
});

test("package exposes a local static preview command", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts.start, "node scripts/serve.mjs");
});
