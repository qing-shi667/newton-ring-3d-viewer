import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findConnectedComponents, readGlb } from "../scripts/glb-utils.mjs";

test("GLB utilities expose parsing and component analysis", async () => {
  const module = await import("../scripts/glb-utils.mjs");
  assert.equal(typeof module.readGlb, "function");
  assert.equal(typeof module.readAccessor, "function");
  assert.equal(typeof module.findConnectedComponents, "function");
  assert.equal(typeof module.writeFilteredGlb, "function");
});

test("component analysis ignores unreferenced vertices in the cleaned GLB", async () => {
  const glb = await readGlb(new URL("../assets/models/newton-ring-clean.glb", import.meta.url));
  const components = findConnectedComponents(glb);
  assert.ok(components.length > 0);
  assert.ok(components.every((component) => component.triangleCount > 0));
});

test("cleaned GLB removes configured triangles but preserves the textured material", async () => {
  const source = await readGlb(new URL("../assets/models/source/newton-ring-source.glb", import.meta.url));
  const cleaned = await readGlb(new URL("../assets/models/newton-ring-clean.glb", import.meta.url));
  const config = JSON.parse(await readFile(new URL("../scripts/model-cleaning-config.json", import.meta.url), "utf8"));
  const sourcePrimitive = source.json.meshes[0].primitives[0];
  const cleanedPrimitive = cleaned.json.meshes[0].primitives[0];
  assert.ok(cleaned.json.accessors[cleanedPrimitive.indices].count < source.json.accessors[sourcePrimitive.indices].count);
  assert.equal(cleanedPrimitive.attributes.TEXCOORD_0 !== undefined, true);
  assert.equal(cleaned.json.materials[0].pbrMetallicRoughness.baseColorTexture.index, source.json.materials[0].pbrMetallicRoughness.baseColorTexture.index);
  assert.ok(config.removeComponentIds.length > 0);
});
