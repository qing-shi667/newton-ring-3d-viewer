import { replaceTexturedStageClips } from "./microscope-geometry.js";
import {
  applyMicroscopeSurfaceCorrections,
  loadColorTexture,
} from "./microscope-surface-corrections.js";
import { createModelViewer, loadModelScene } from "./viewer.js";

const clipModelPromise = loadModelScene("./assets/models/source/stage-clip-source.glb");
clipModelPromise.catch(() => {});
const railTexturePromise = loadColorTexture(
  "./assets/textures/microscope/tripo-part-16-silver.jpg",
).catch((error) => {
  console.error(error);
  return null;
});

const microscopeViewer = createModelViewer({
  container: document.getElementById("microscope-viewer"),
  modelUrl: "./assets/models/source/travelling-microscope-textured.glb",
  async onLoaded({ model }) {
    const donorModel = await clipModelPromise;
    const result = replaceTexturedStageClips(model, donorModel);
    if (!result.replaced) {
      throw new Error("Replacement clip nodes were not found");
    }
    const railTexture = await railTexturePromise;
    applyMicroscopeSurfaceCorrections(model, railTexture);
  },
});

document.querySelector('[data-action="reset"]').addEventListener("click", () => {
  microscopeViewer.reset();
});

window.microscopeViewerReady = true;

