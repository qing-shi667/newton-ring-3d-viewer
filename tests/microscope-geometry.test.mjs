import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

const geometryModule = await import("../src/microscope-geometry.js").catch(() => ({}));

test("textured stage clips are replaced by the black donor clip and its Z mirror", () => {
  assert.equal(typeof geometryModule.replaceTexturedStageClips, "function");

  const model = new THREE.Group();
  const originalLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.2));
  originalLeft.name = "tripo_part_9";
  const originalRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.2));
  originalRight.name = "tripo_part_28";
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2));
  glass.name = "tripo_part_17";
  glass.position.set(3, 0, 1);
  model.add(originalLeft, originalRight, glass);

  const donorModel = new THREE.Group();
  const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x121517 });
  const donorClip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.2), blackMaterial);
  donorClip.name = "stage-clip-left";
  donorClip.position.set(0.5, 0.2, 0.4);
  donorModel.add(donorClip);

  const result = geometryModule.replaceTexturedStageClips(model, donorModel);
  const left = model.getObjectByName("replacement-stage-clip-left");
  const right = model.getObjectByName("replacement-stage-clip-right");
  const stageCenterZ = 1;

  assert.equal(originalLeft.visible, false);
  assert.equal(originalRight.visible, false);
  assert.ok(left);
  assert.ok(right);
  assert.equal(left.material, blackMaterial);
  assert.equal(right.material, blackMaterial);
  assert.ok(Math.abs(left.position.x - right.position.x) < 1e-6);
  assert.ok(Math.abs(left.position.y - right.position.y) < 1e-6);
  assert.ok(Math.abs(left.position.z + right.position.z - 2 * stageCenterZ) < 1e-6);
  assert.deepEqual(result, { replaced: true, hidden: 2, created: 2 });
});

test("textured stage clip replacement is skipped when required nodes are absent", () => {
  assert.equal(typeof geometryModule.replaceTexturedStageClips, "function");
  assert.deepEqual(
    geometryModule.replaceTexturedStageClips(new THREE.Group(), new THREE.Group()),
    { replaced: false },
  );
});

test("malformed stage clip is replaced by a mirrored copy of the good clip", () => {
  assert.equal(typeof geometryModule.repairMicroscopeStageClips, "function");

  const model = new THREE.Group();
  const malformed = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1));
  malformed.name = "tripo_part_13";
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2));
  glass.name = "tripo_part_15";
  glass.position.set(3, 0, 1);
  const goodClip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.2));
  goodClip.name = "tripo_part_28";
  goodClip.position.set(0.5, 0.2, 0.4);
  model.add(malformed, glass, goodClip);

  const result = geometryModule.repairMicroscopeStageClips(model);
  const mirrored = model.getObjectByName("stage-clip-right");

  assert.equal(malformed.visible, false);
  assert.ok(mirrored);
  assert.notEqual(mirrored, goodClip);
  assert.equal(mirrored.geometry, goodClip.geometry);
  assert.ok(Math.abs(mirrored.position.x - 0.5) < 1e-6);
  assert.ok(Math.abs(mirrored.position.y - 0.2) < 1e-6);
  assert.ok(Math.abs(mirrored.position.z - 1.6) < 1e-6);
  mirrored.updateMatrix();
  const mirroredXAxis = new THREE.Vector3(1, 0, 0).transformDirection(mirrored.matrix);
  assert.ok(mirroredXAxis.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-6);
  const mirroredZAxis = new THREE.Vector3(0, 0, 1).transformDirection(mirrored.matrix);
  assert.ok(mirroredZAxis.distanceTo(new THREE.Vector3(0, 0, -1)) < 1e-6);
  assert.deepEqual(result, { repaired: true, hidden: "tripo_part_13", created: "stage-clip-right" });
});

test("stage clip repair is skipped when required source meshes are absent", () => {
  assert.equal(typeof geometryModule.repairMicroscopeStageClips, "function");
  assert.deepEqual(
    geometryModule.repairMicroscopeStageClips(new THREE.Group()),
    { repaired: false },
  );
});
