# Textured Microscope Clip Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the uploaded textured microscope while replacing only its two stage clips with the corrected black clip geometry from the current source model.

**Architecture:** Keep the uploaded textured GLB untouched as the full-model asset. Export one corrected clip from the current source into a small donor GLB, then hide the textured model's two original clip nodes and insert a donor clip plus a Z-mirrored clone at runtime. The full-model material override is removed so all 41 embedded textures remain active.

**Tech Stack:** Three.js 0.180, GLTFLoader, GLTFExporter, Node.js test runner, static GitHub Pages assets.

---

### Task 1: Add Textured And Donor Model Assets

**Files:**
- Create: `assets/models/source/travelling-microscope-textured.glb`
- Create: `assets/models/source/stage-clip-source.glb`
- Create: `scripts/export-stage-clip.mjs`
- Modify: `package.json`
- Modify: `tests/static-site.test.mjs`

- [ ] **Step 1: Write the failing asset test**

Extend `tests/static-site.test.mjs` to validate the two new GLBs and their intended contents:

```js
test("textured microscope and replacement clip assets are publishable GLBs", async () => {
  for (const name of [
    "travelling-microscope-textured.glb",
    "stage-clip-source.glb",
  ]) {
    const url = new URL(`assets/models/source/${name}`, ROOT);
    const info = await stat(url);
    const header = await readFile(url);
    assert.equal(header.subarray(0, 4).toString("ascii"), "glTF");
    assert.ok(info.size < 100 * 1024 * 1024, `${name} exceeds 100 MB`);
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/static-site.test.mjs`

Expected: FAIL because `travelling-microscope-textured.glb` and `stage-clip-source.glb` do not exist.

- [ ] **Step 3: Copy the uploaded textured GLB without changing its bytes**

Copy:

```text
C:\Users\ASUS\Desktop\物理竞赛\3D建模\tripo_convert_3656e292-6561-4910-a7a0-5d4a7aade425.glb
```

to:

```text
assets/models/source/travelling-microscope-textured.glb
```

Verify both files have the same SHA-256 hash with `Get-FileHash`.

- [ ] **Step 4: Add a reproducible clip exporter**

Create `scripts/export-stage-clip.mjs` that loads `travelling-microscope-source.glb`, clones `tripo_part_28`, assigns a black `MeshStandardMaterial`, and exports binary GLB:

```js
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
}

globalThis.FileReader = NodeFileReader;
const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "assets/models/source/travelling-microscope-source.glb"));
const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const gltf = await new Promise((resolveLoad, rejectLoad) => {
  new GLTFLoader().parse(buffer, "", resolveLoad, rejectLoad);
});
const sourceClip = gltf.scene.getObjectByName("tripo_part_28");
if (!sourceClip) throw new Error("tripo_part_28 was not found");
const clip = sourceClip.clone(false);
clip.name = "stage-clip-left";
clip.material = new THREE.MeshStandardMaterial({
  name: "stage-clip-black",
  color: 0x121517,
  metalness: 0.08,
  roughness: 0.42,
});
const output = await new GLTFExporter().parseAsync(clip, { binary: true });
await writeFile(resolve(root, "assets/models/source/stage-clip-source.glb"), Buffer.from(output));
```

Add `"export:clip": "node scripts/export-stage-clip.mjs"` to `package.json` and run `npm.cmd run export:clip`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/static-site.test.mjs`

Expected: PASS for both new GLB files.

- [ ] **Step 6: Commit the asset slice**

```bash
git add assets/models/source/travelling-microscope-textured.glb assets/models/source/stage-clip-source.glb scripts/export-stage-clip.mjs package.json tests/static-site.test.mjs
git commit -m "feat: add textured microscope and clip assets"
```

### Task 2: Replace Only The Stage Clips

**Files:**
- Modify: `src/microscope-geometry.js`
- Modify: `tests/microscope-geometry.test.mjs`

- [ ] **Step 1: Write the failing replacement test**

Build a Three.js test scene with textured-model nodes named `tripo_part_9`, `tripo_part_28`, and `tripo_part_17`, plus a donor mesh named `stage-clip-left`. Assert the replacement hides both original clips, keeps the donor material, and mirrors only along Z:

```js
const result = replaceTexturedStageClips(model, donor);
const left = model.getObjectByName("replacement-stage-clip-left");
const right = model.getObjectByName("replacement-stage-clip-right");
assert.equal(originalLeft.visible, false);
assert.equal(originalRight.visible, false);
assert.equal(left.material, donorClip.material);
assert.equal(right.material, donorClip.material);
assert.ok(Math.abs(left.position.x - right.position.x) < 1e-6);
assert.ok(Math.abs(left.position.y - right.position.y) < 1e-6);
assert.ok(Math.abs(left.position.z + right.position.z - 2 * stageCenterZ) < 1e-6);
assert.deepEqual(result, { replaced: true, hidden: 2, created: 2 });
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/microscope-geometry.test.mjs`

Expected: FAIL because `replaceTexturedStageClips` is not exported.

- [ ] **Step 3: Implement the pure geometry replacement**

Add `replaceTexturedStageClips(model, donorModel)` to `src/microscope-geometry.js`:

```js
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
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/microscope-geometry.test.mjs`

Expected: PASS, including the missing-node no-op case.

- [ ] **Step 5: Commit the replacement slice**

```bash
git add src/microscope-geometry.js tests/microscope-geometry.test.mjs
git commit -m "feat: replace textured model stage clips"
```

### Task 3: Load The Textured Model Without Overwriting Materials

**Files:**
- Modify: `src/viewer.js`
- Modify: `src/main.js`
- Modify: `tests/static-site.test.mjs`
- Delete: `src/microscope-materials.js`
- Delete: `tests/microscope-materials.test.mjs`

- [ ] **Step 1: Write the failing integration assertions**

Update the main-module static test:

```js
assert.match(source, /travelling-microscope-textured\.glb/);
assert.match(source, /stage-clip-source\.glb/);
assert.match(source, /replaceTexturedStageClips/);
assert.doesNotMatch(source, /applyMicroscopeMaterials/);
assert.doesNotMatch(source, /createMicroscopeMaterials/);
```

Add a viewer assertion requiring asynchronous completion before framing:

```js
assert.match(viewerSource, /await onLoaded\?\./);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/static-site.test.mjs`

Expected: FAIL because `main.js` still loads the untextured source and applies generated materials.

- [ ] **Step 3: Export a promise-based donor loader and await setup**

Add to `src/viewer.js`:

```js
export function loadModelScene(modelUrl) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(modelUrl, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}
```

Make the full-model success callback `async`, add the model to `root`, and run `await onLoaded?.({ root, model, scene })` before `frameObject`. Catch hook failures so the textured model remains visible and set the status text to `夹片替换失败，已显示原始贴图模型。`.

- [ ] **Step 4: Switch `main.js` to the textured model and donor clip**

Use:

```js
import { replaceTexturedStageClips } from "./microscope-geometry.js";
import { createModelViewer, loadModelScene } from "./viewer.js";

const clipModelPromise = loadModelScene("./assets/models/source/stage-clip-source.glb");
const microscopeViewer = createModelViewer({
  container: document.getElementById("microscope-viewer"),
  modelUrl: "./assets/models/source/travelling-microscope-textured.glb",
  async onLoaded({ model }) {
    const donorModel = await clipModelPromise;
    const result = replaceTexturedStageClips(model, donorModel);
    if (!result.replaced) throw new Error("Replacement clip nodes were not found");
  },
});
```

Remove imports and calls from `microscope-materials.js`. Delete the now-unused material module and its tests so there is no path that can overwrite the embedded textures.

- [ ] **Step 5: Run integration and full tests**

Run:

```bash
node --test tests/static-site.test.mjs tests/microscope-geometry.test.mjs
npm.cmd test
```

Expected: all tests PASS with zero failures.

- [ ] **Step 6: Commit the integration slice**

```bash
git add src/main.js src/viewer.js src/microscope-geometry.js tests/static-site.test.mjs src/microscope-materials.js tests/microscope-materials.test.mjs
git commit -m "feat: display textured microscope with corrected clips"
```

### Task 4: Documentation And Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the model documentation**

Document that the site displays the uploaded textured model unchanged and replaces only its stage clips from a small donor asset. Remove the previous statement that all photographed materials are assigned at runtime.

- [ ] **Step 2: Run complete verification**

Run:

```powershell
npm.cmd test
node --check src\main.js
node --check src\viewer.js
node --check src\microscope-geometry.js
git diff --check
Get-FileHash 'C:\Users\ASUS\Desktop\物理竞赛\3D建模\tripo_convert_3656e292-6561-4910-a7a0-5d4a7aade425.glb'
Get-FileHash 'assets\models\source\travelling-microscope-textured.glb'
```

Expected: tests and syntax checks exit 0, `git diff --check` reports no errors, and both textured-model hashes match.

- [ ] **Step 3: Inspect the local preview**

At `http://127.0.0.1:8050/`, verify the model loads with embedded labels and textures, both original clips are absent, the corrected black clips occupy the same rear edge, rotation and zoom still work, and no unrelated material is replaced.

- [ ] **Step 4: Commit documentation only after local inspection**

```bash
git add README.md
git commit -m "docs: describe textured microscope assembly"
```

Do not push until the user explicitly approves the local preview.
