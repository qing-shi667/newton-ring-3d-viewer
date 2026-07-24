import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

const corrections = await import("../src/microscope-surface-corrections.js").catch(() => ({}));

test("rail and plaque finishes are corrected without changing unrelated meshes", () => {
  assert.equal(typeof corrections.applyMicroscopeSurfaceCorrections, "function");

  const model = new THREE.Group();
  const originalRailSupportMaterial = new THREE.MeshStandardMaterial({ color: 0x2255aa });
  const railSupport = new THREE.Mesh(new THREE.BoxGeometry(), originalRailSupportMaterial);
  railSupport.name = "tripo_part_1";
  const originalRailMaterial = new THREE.MeshStandardMaterial({ color: 0x2255aa });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(), originalRailMaterial);
  rail.name = "tripo_part_16";
  const informationPlaque = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  informationPlaque.name = "tripo_part_11";
  const brandPlaque = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  brandPlaque.name = "tripo_part_30";
  const unrelatedMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const unrelated = new THREE.Mesh(new THREE.BoxGeometry(), unrelatedMaterial);
  unrelated.name = "unrelated";
  model.add(railSupport, rail, informationPlaque, brandPlaque, unrelated);
  const railTextures = {
    part1: new THREE.Texture(),
    part16: new THREE.Texture(),
  };

  const result = corrections.applyMicroscopeSurfaceCorrections(model, railTextures);

  assert.equal(railSupport.material.map, railTextures.part1);
  assert.equal(rail.material.map, railTextures.part16);
  assert.notEqual(railSupport.material, originalRailSupportMaterial);
  assert.notEqual(rail.material, originalRailMaterial);
  assert.equal(informationPlaque.material.name, "information-plaque-silver");
  assert.equal(brandPlaque.material.name, "brand-plaque-silver");
  assert.equal(unrelated.material, unrelatedMaterial);
  assert.deepEqual(result, {
    railPart1: true,
    railPart16: true,
    informationPlaque: true,
    brandPlaque: true,
    corrected: 4,
  });
});

test("missing surface targets are skipped independently", () => {
  assert.equal(typeof corrections.applyMicroscopeSurfaceCorrections, "function");
  assert.deepEqual(
    corrections.applyMicroscopeSurfaceCorrections(new THREE.Group(), {}),
    {
      railPart1: false,
      railPart16: false,
      informationPlaque: false,
      brandPlaque: false,
      corrected: 0,
    },
  );
});
