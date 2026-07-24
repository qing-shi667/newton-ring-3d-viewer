import * as THREE from "three";

export function replaceTexturedStageClips(model, donorModel) {
  const originalLeft = model.getObjectByName("tripo_part_9");
  const originalRight = model.getObjectByName("tripo_part_28");
  const glass = model.getObjectByName("tripo_part_17");
  const donor = donorModel.getObjectByName("stage-clip-left");

  if (!originalLeft || !originalRight || !glass || !donor || !originalLeft.parent) {
    return { replaced: false };
  }

  model.updateMatrixWorld(true);
  donorModel.updateMatrixWorld(true);

  const parent = originalLeft.parent;
  const parentInverse = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const left = donor.clone(false);
  left.name = "replacement-stage-clip-left";
  const leftLocal = new THREE.Matrix4().multiplyMatrices(parentInverse, donor.matrixWorld);
  leftLocal.decompose(left.position, left.quaternion, left.scale);

  const center = new THREE.Box3().setFromObject(glass).getCenter(new THREE.Vector3());
  const mirror = new THREE.Matrix4()
    .makeTranslation(center.x, center.y, center.z)
    .multiply(new THREE.Matrix4().makeScale(1, 1, -1))
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  const right = donor.clone(false);
  right.name = "replacement-stage-clip-right";
  const rightWorld = new THREE.Matrix4().multiplyMatrices(mirror, donor.matrixWorld);
  const rightLocal = new THREE.Matrix4().multiplyMatrices(parentInverse, rightWorld);
  rightLocal.decompose(right.position, right.quaternion, right.scale);

  originalLeft.visible = false;
  originalRight.visible = false;
  parent.add(left, right);

  return { replaced: true, hidden: 2, created: 2 };
}

export function repairMicroscopeStageClips(model) {
  const malformed = model.getObjectByName("tripo_part_13");
  const goodClip = model.getObjectByName("tripo_part_28");
  const glass = model.getObjectByName("tripo_part_15");
  if (!malformed || !goodClip || !glass || !goodClip.parent) return { repaired: false };

  model.updateMatrixWorld(true);
  const stageCenter = new THREE.Box3().setFromObject(glass).getCenter(new THREE.Vector3());
  const parent = goodClip.parent;
  const mirror = new THREE.Matrix4()
    .makeTranslation(stageCenter.x, stageCenter.y, stageCenter.z)
    .multiply(new THREE.Matrix4().makeScale(1, 1, -1))
    .multiply(new THREE.Matrix4().makeTranslation(-stageCenter.x, -stageCenter.y, -stageCenter.z));
  const mirroredWorld = new THREE.Matrix4().multiplyMatrices(mirror, goodClip.matrixWorld);
  const mirroredLocal = new THREE.Matrix4()
    .copy(parent.matrixWorld)
    .invert()
    .multiply(mirroredWorld);

  malformed.visible = false;
  const mirrored = goodClip.clone(false);
  mirrored.name = "stage-clip-right";
  mirrored.matrix.copy(mirroredLocal);
  mirrored.matrix.decompose(mirrored.position, mirrored.quaternion, mirrored.scale);
  parent.add(mirrored);

  return { repaired: true, hidden: malformed.name, created: mirrored.name };
}
