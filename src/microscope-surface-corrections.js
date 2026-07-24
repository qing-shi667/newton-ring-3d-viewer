import * as THREE from "three";

export function loadColorTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

export function applyMicroscopeSurfaceCorrections(model, railTexture) {
  const railTextures = railTexture && railTexture.part1 !== undefined
    ? railTexture
    : { part1: null, part16: railTexture };
  const railPart1 = model.getObjectByName("tripo_part_1");
  const rail = model.getObjectByName("tripo_part_16");
  const informationPlaque = model.getObjectByName("tripo_part_11");
  const brandPlaque = model.getObjectByName("tripo_part_30");
  const result = {
    railPart1: Boolean(railPart1 && railTextures.part1),
    railPart16: Boolean(rail && railTextures.part16),
    informationPlaque: Boolean(informationPlaque),
    brandPlaque: Boolean(brandPlaque),
    corrected: 0,
  };

  if (result.railPart1) {
    railPart1.material = Array.isArray(railPart1.material)
      ? railPart1.material.map((material) => material.clone())
      : railPart1.material.clone();
    const materials = Array.isArray(railPart1.material) ? railPart1.material : [railPart1.material];
    for (const material of materials) {
      material.name = "silver-rail-part-1-texture";
      material.map = railTextures.part1;
      material.needsUpdate = true;
    }
    result.corrected += 1;
  }

  if (result.railPart16) {
    rail.material = Array.isArray(rail.material)
      ? rail.material.map((material) => material.clone())
      : rail.material.clone();
    const materials = Array.isArray(rail.material) ? rail.material : [rail.material];
    for (const material of materials) {
      material.name = "silver-rail-part-16-texture";
      material.map = railTextures.part16;
      material.needsUpdate = true;
    }
    result.corrected += 1;
  }

  if (result.informationPlaque) {
    informationPlaque.material = new THREE.MeshStandardMaterial({
      name: "information-plaque-silver",
      color: 0x8f999a,
      metalness: 0.12,
      roughness: 0.62,
    });
    result.corrected += 1;
  }

  if (result.brandPlaque) {
    brandPlaque.material = new THREE.MeshStandardMaterial({
      name: "brand-plaque-silver",
      color: 0xaeb3b1,
      metalness: 0.12,
      roughness: 0.62,
    });
    result.corrected += 1;
  }

  return result;
}
