import { replaceTexturedStageClips } from "./microscope-geometry.js";
import { createModelViewer, loadModelScene } from "./viewer.js";

const clipModelPromise = loadModelScene("./assets/models/source/stage-clip-source.glb");
clipModelPromise.catch(() => {});

const microscopeViewer = createModelViewer({
  container: document.getElementById("microscope-viewer"),
  modelUrl: "./assets/models/source/travelling-microscope-textured.glb",
  async onLoaded({ model }) {
    const donorModel = await clipModelPromise;
    const result = replaceTexturedStageClips(model, donorModel);
    if (!result.replaced) {
      throw new Error("Replacement clip nodes were not found");
    }
  },
});

document.querySelector('[data-action="reset"]').addEventListener("click", () => {
  microscopeViewer.reset();
});

window.microscopeViewerReady = true;

