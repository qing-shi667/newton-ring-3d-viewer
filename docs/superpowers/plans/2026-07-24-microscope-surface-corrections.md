# Microscope Surface Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recolor the textured microscope's blue rail and two plaque meshes to surrounding silver-gray finishes without modifying the uploaded GLB.

**Architecture:** A pure pixel transform converts only blue pixels from `tripo_part_16`'s embedded JPEG into luminance-preserving silver gray. A reproducible Node script writes the transformed JPEG as a separate web asset, while a focused Three.js runtime helper assigns that texture to the rail and neutral silver materials to the two plaque meshes.

**Tech Stack:** Three.js 0.180, jpeg-js 0.4, Node.js test runner, static GitHub Pages assets.

---

### Task 1: Add The Blue-To-Silver Texture Transform

**Files:**
- Create: `src/texture-recolor.js`
- Create: `tests/texture-recolor.test.mjs`

- [ ] **Step 1: Write the failing pixel-transform tests**

Create `tests/texture-recolor.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

const module = await import("../src/texture-recolor.js").catch(() => ({}));

test("blue pixels become luminance-preserving neutral silver", () => {
  assert.equal(typeof module.recolorBluePixelsToSilver, "function");
  const source = Uint8Array.from([48, 88, 142, 255]);
  const output = module.recolorBluePixelsToSilver(source);
  assert.notDeepEqual([...output], [...source]);
  assert.ok(Math.abs(output[0] - output[1]) <= 3);
  assert.ok(Math.abs(output[1] - output[2]) <= 3);
  assert.ok(output[0] > source[0]);
  assert.equal(output[3], 255);
});

test("non-blue pixels remain byte-identical", () => {
  const source = Uint8Array.from([
    120, 122, 121, 255,
    18, 20, 22, 255,
    150, 110, 70, 255,
  ]);
  assert.deepEqual([...module.recolorBluePixelsToSilver(source)], [...source]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/texture-recolor.test.mjs`

Expected: FAIL because `src/texture-recolor.js` does not exist.

- [ ] **Step 3: Implement the pure transform**

Create `src/texture-recolor.js`:

```js
function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function recolorBluePixelsToSilver(source) {
  const output = Uint8Array.from(source);
  for (let offset = 0; offset + 3 < output.length; offset += 4) {
    const red = output[offset];
    const green = output[offset + 1];
    const blue = output[offset + 2];
    const isBlue = blue >= 60 && blue - red >= 20 && blue - green >= 8;
    if (!isBlue) continue;

    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const silver = clampByte(76 + luminance * 0.75);
    output[offset] = silver;
    output[offset + 1] = clampByte(silver + 1);
    output[offset + 2] = clampByte(silver + 2);
  }
  return output;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/texture-recolor.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the transform**

```bash
git add src/texture-recolor.js tests/texture-recolor.test.mjs
git commit -m "feat: add blue-to-silver texture transform"
```

### Task 2: Generate The Rail Texture Asset

**Files:**
- Create: `scripts/generate-microscope-surface-textures.mjs`
- Create: `assets/textures/microscope/tripo-part-16-silver.jpg`
- Modify: `package.json`
- Modify: `tests/static-site.test.mjs`

- [ ] **Step 1: Write the failing asset test**

Add this test to `tests/static-site.test.mjs`:

```js
test("silver rail texture is a publishable JPEG", async () => {
  const bytes = await readFile(new URL(
    "assets/textures/microscope/tripo-part-16-silver.jpg",
    ROOT,
  ));
  assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.ok(bytes.length > 1000);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/static-site.test.mjs`

Expected: FAIL with `ENOENT` for the generated JPEG.

- [ ] **Step 3: Add the reproducible generator**

Create `scripts/generate-microscope-surface-textures.mjs` that:

```js
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import jpeg from "jpeg-js";
import { recolorBluePixelsToSilver } from "../src/texture-recolor.js";
import { readGlb } from "./glb-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const glb = await readGlb(resolve(
  root,
  "assets/models/source/travelling-microscope-textured.glb",
));
const node = glb.json.nodes.find((item) => item.name === "tripo_part_16");
if (!node || node.mesh === undefined) throw new Error("tripo_part_16 was not found");
const primitive = glb.json.meshes[node.mesh].primitives[0];
const material = glb.json.materials[primitive.material];
const textureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
const image = glb.json.images[glb.json.textures[textureIndex].source];
const view = glb.json.bufferViews[image.bufferView];
const start = view.byteOffset ?? 0;
const decoded = jpeg.decode(
  glb.binary.subarray(start, start + view.byteLength),
  { useTArray: true, formatAsRGBA: true },
);
const pixels = recolorBluePixelsToSilver(decoded.data);
const output = jpeg.encode({ data: pixels, width: decoded.width, height: decoded.height }, 95);
const outputDir = resolve(root, "assets/textures/microscope");
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "tripo-part-16-silver.jpg"), output.data);
```

Add to `package.json`:

```json
"generate:surfaces": "node scripts/generate-microscope-surface-textures.mjs"
```

Run: `npm.cmd run generate:surfaces`

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/static-site.test.mjs`

Expected: the JPEG asset test passes.

- [ ] **Step 5: Commit the asset slice**

```bash
git add scripts/generate-microscope-surface-textures.mjs assets/textures/microscope/tripo-part-16-silver.jpg package.json tests/static-site.test.mjs
git commit -m "feat: add silver rail texture asset"
```

### Task 3: Apply The Three Runtime Surface Corrections

**Files:**
- Create: `src/microscope-surface-corrections.js`
- Create: `tests/microscope-surface-corrections.test.mjs`
- Modify: `src/main.js`
- Modify: `tests/static-site.test.mjs`

- [ ] **Step 1: Write the failing runtime helper tests**

Create `tests/microscope-surface-corrections.test.mjs` with Three.js meshes named `tripo_part_16`, `tripo_part_11`, `tripo_part_30`, and `unrelated`. Assert:

```js
const result = corrections.applyMicroscopeSurfaceCorrections(model, railTexture);
assert.equal(rail.material.map, railTexture);
assert.notEqual(rail.material, originalRailMaterial);
assert.equal(informationPlaque.material.name, "information-plaque-silver");
assert.equal(brandPlaque.material.name, "brand-plaque-silver");
assert.equal(unrelated.material, unrelatedMaterial);
assert.deepEqual(result, { rail: true, informationPlaque: true, brandPlaque: true, corrected: 3 });
```

Add a missing-target test that expects:

```js
assert.deepEqual(
  corrections.applyMicroscopeSurfaceCorrections(new THREE.Group(), railTexture),
  { rail: false, informationPlaque: false, brandPlaque: false, corrected: 0 },
);
```

- [ ] **Step 2: Run the helper test and verify RED**

Run: `node --test tests/microscope-surface-corrections.test.mjs`

Expected: FAIL because the runtime helper module does not exist.

- [ ] **Step 3: Implement the runtime helper**

Create `src/microscope-surface-corrections.js` with:

```js
import * as THREE from "three";

export function loadColorTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      resolve(texture);
    }, undefined, reject);
  });
}

export function applyMicroscopeSurfaceCorrections(model, railTexture) {
  const rail = model.getObjectByName("tripo_part_16");
  const informationPlaque = model.getObjectByName("tripo_part_11");
  const brandPlaque = model.getObjectByName("tripo_part_30");
  const result = {
    rail: Boolean(rail && railTexture),
    informationPlaque: Boolean(informationPlaque),
    brandPlaque: Boolean(brandPlaque),
    corrected: 0,
  };

  if (result.rail) {
    rail.material = rail.material.clone();
    rail.material.name = "silver-rail-texture";
    rail.material.map = railTexture;
    rail.material.needsUpdate = true;
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
```

- [ ] **Step 4: Run the helper test and verify GREEN**

Run: `node --test tests/microscope-surface-corrections.test.mjs`

Expected: both helper tests pass.

- [ ] **Step 5: Write failing static integration assertions**

Add to the main-module test in `tests/static-site.test.mjs`:

```js
assert.match(source, /tripo-part-16-silver\.jpg/);
assert.match(source, /applyMicroscopeSurfaceCorrections/);
assert.match(source, /loadColorTexture/);
```

Run: `node --test tests/static-site.test.mjs`

Expected: FAIL because `src/main.js` does not load or apply the correction.

- [ ] **Step 6: Integrate the helper in the model load hook**

In `src/main.js`, import both helper functions, start a handled texture promise, and apply the corrections after the stage clips:

```js
import {
  applyMicroscopeSurfaceCorrections,
  loadColorTexture,
} from "./microscope-surface-corrections.js";

const railTexturePromise = loadColorTexture(
  "./assets/textures/microscope/tripo-part-16-silver.jpg",
).catch((error) => {
  console.error(error);
  return null;
});

// Inside onLoaded after clip replacement:
const railTexture = await railTexturePromise;
applyMicroscopeSurfaceCorrections(model, railTexture);
```

- [ ] **Step 7: Run integration and full tests**

Run:

```powershell
node --test tests/microscope-surface-corrections.test.mjs tests/static-site.test.mjs
npm.cmd test
```

Expected: all tests pass with zero failures.

- [ ] **Step 8: Commit the runtime slice**

```bash
git add src/microscope-surface-corrections.js tests/microscope-surface-corrections.test.mjs src/main.js tests/static-site.test.mjs
git commit -m "feat: correct microscope rail and plaque finishes"
```

### Task 4: Documentation And Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Extend the model documentation**

Document the generated silver rail texture, the two plaque material corrections, and the fact that the uploaded GLB remains byte-identical.

- [ ] **Step 2: Run complete verification**

Run:

```powershell
npm.cmd test
node --check src\main.js
node --check src\microscope-surface-corrections.js
node --check src\texture-recolor.js
node --check scripts\generate-microscope-surface-textures.mjs
git diff --check
Get-FileHash 'C:\Users\ASUS\Desktop\物理竞赛\3D建模\tripo_convert_3656e292-6561-4910-a7a0-5d4a7aade425.glb'
Get-FileHash 'assets\models\source\travelling-microscope-textured.glb'
```

Expected: all commands exit 0 and both textured-model hashes are identical.

- [ ] **Step 3: Verify the local server**

Check that `http://127.0.0.1:8050/src/main.js` references the generated texture and that the JPEG endpoint returns HTTP 200.

- [ ] **Step 4: Keep documentation local until visual approval**

Leave `README.md` uncommitted and do not push. Ask the user to refresh `http://127.0.0.1:8050/` and inspect the rail and both plaques.
