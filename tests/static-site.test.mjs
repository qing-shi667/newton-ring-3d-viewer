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

test("main module loads only the supplied microscope model", async () => {
  const source = await read("src/main.js");
  assert.match(source, /travelling-microscope-source\.glb/);
  assert.doesNotMatch(source, /newton-ring-clean\.glb/);
  assert.doesNotMatch(source, /createMicroscopeLowerAssembly/);
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
