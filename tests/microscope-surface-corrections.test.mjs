import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

const corrections = await import("../src/microscope-surface-corrections.js").catch(() => ({}));

test("rail and plaque finishes are corrected without changing unrelated meshes", () => {
  assert.equal(typeof corrections.applyMicroscopeSurfaceCorrections, "function");

  const model = new THREE.Group();
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
  model.add(rail, informationPlaque, brandPlaque, unrelated);
  const railTexture = new THREE.Texture();

  const result = corrections.applyMicroscopeSurfaceCorrections(model, railTexture);

  assert.equal(rail.material.map, railTexture);
  assert.notEqual(rail.material, originalRailMaterial);
  assert.equal(informationPlaque.material.name, "information-plaque-silver");
  assert.equal(brandPlaque.material.name, "brand-plaque-silver");
  assert.equal(unrelated.material, unrelatedMaterial);
  assert.deepEqual(result, {
    rail: true,
    informationPlaque: true,
    brandPlaque: true,
    corrected: 3,
  });
});

test("missing surface targets are skipped independently", () => {
  assert.equal(typeof corrections.applyMicroscopeSurfaceCorrections, "function");
  assert.deepEqual(
    corrections.applyMicroscopeSurfaceCorrections(new THREE.Group(), new THREE.Texture()),
    {
      rail: false,
      informationPlaque: false,
      brandPlaque: false,
      corrected: 0,
    },
  );
});
