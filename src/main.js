import * as THREE from "three";
import { createMicroscopeLowerAssembly, MICROSCOPE_ASSEMBLY_PLACEMENT } from "./microscope-parts.js";
import { createModelViewer } from "./viewer.js";

const viewers = {
  newton: createModelViewer({
    container: document.getElementById("newton-viewer"),
    modelUrl: "./assets/models/newton-ring-clean.glb",
  }),
  microscope: createModelViewer({
    container: document.getElementById("microscope-viewer"),
    modelUrl: "./assets/models/source/travelling-microscope-source.glb",
    onLoaded({ root, model }) {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const assembly = createMicroscopeLowerAssembly();
      const unit = Math.max(size.x, size.y, size.z) * MICROSCOPE_ASSEMBLY_PLACEMENT.scale;
      assembly.scale.setScalar(unit);
      assembly.rotation.set(...MICROSCOPE_ASSEMBLY_PLACEMENT.rotation);
      assembly.position.set(
        center.x + size.x * MICROSCOPE_ASSEMBLY_PLACEMENT.anchor[0],
        center.y + size.y * MICROSCOPE_ASSEMBLY_PLACEMENT.anchor[1],
        center.z + size.z * MICROSCOPE_ASSEMBLY_PLACEMENT.anchor[2],
      );
      root.add(assembly);
    },
  }),
};

document.querySelectorAll('[data-action="reset"]').forEach((button) => {
  button.addEventListener("click", () => viewers[button.dataset.viewer].reset());
});

window.newtonRingViewersReady = true;

