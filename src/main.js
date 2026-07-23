import { createModelViewer } from "./viewer.js";

const microscopeViewer = createModelViewer({
  container: document.getElementById("microscope-viewer"),
  modelUrl: "./assets/models/source/travelling-microscope-source.glb",
});

document.querySelector('[data-action="reset"]').addEventListener("click", () => {
  microscopeViewer.reset();
});

window.microscopeViewerReady = true;

