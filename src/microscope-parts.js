import * as THREE from "three";

export const MICROSCOPE_ASSEMBLY_PLACEMENT = {
  anchor: [0.02, -0.13, 0.27],
  scale: 0.27,
  rotation: [0, Math.PI / 2, 0],
};

function mesh(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

export function createMicroscopeLowerAssembly() {
  const group = new THREE.Group();
  group.name = "microscope-lower-assembly";

  const metal = new THREE.MeshStandardMaterial({ color: 0x969b9e, roughness: 0.48, metalness: 0.35 });
  const edgeMetal = new THREE.MeshStandardMaterial({ color: 0x4f565a, roughness: 0.42, metalness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x121719, roughness: 0.66, metalness: 0.18 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xbac8cb,
    roughness: 0.2,
    transmission: 0.3,
    transparent: true,
    opacity: 0.75,
  });

  group.add(mesh(new THREE.BoxGeometry(0.18, 0.58, 0.58), metal, [0, 0, 0]));
  group.add(mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), edgeMetal, [0.04, 0.09, -0.31]));
  group.add(mesh(new THREE.BoxGeometry(0.34, 0.09, 0.08), edgeMetal, [-0.09, 0.43, -0.31]));

  group.add(mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.28, 32), metal, [0.03, -0.23, 0.4], [Math.PI / 2, 0, 0]));
  group.add(mesh(new THREE.TorusGeometry(0.25, 0.055, 18, 48), edgeMetal, [0.03, -0.24, 0.66], [Math.PI / 2, 0, 0]));
  group.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.035, 48), glass, [0.03, -0.24, 0.66], [Math.PI / 2, 0, 0]));

  group.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 40), edgeMetal, [0.03, -0.02, -0.42], [Math.PI / 2, 0, 0]));
  const wheel = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.24, 48), black, [0.03, -0.02, -0.63], [Math.PI / 2, 0, 0]);
  group.add(wheel);

  for (let index = 0; index < 28; index += 1) {
    const angle = (index / 28) * Math.PI * 2;
    const rib = mesh(new THREE.BoxGeometry(0.025, 0.055, 0.27), black);
    rib.position.set(0.03 + Math.cos(angle) * 0.31, -0.02 + Math.sin(angle) * 0.31, -0.63);
    rib.rotation.z = angle;
    group.add(rib);
  }

  return group;
}

