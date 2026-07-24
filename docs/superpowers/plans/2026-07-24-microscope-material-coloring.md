# Microscope Material Coloring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply photograph-referenced materials to all 42 microscope meshes without modifying the source GLB.

**Architecture:** A focused material module owns the palette and explicit mesh-name-to-role mapping. The existing viewer passes the loaded GLTF scene to this module through `onLoaded`; diagnostic colors are used locally to identify meshes and are removed before deployment.

**Tech Stack:** JavaScript modules, Three.js 0.180.0, Node.js test runner, static GitHub Pages site.

---

### Task 1: Material Mapping Contract

**Files:**
- Create: `src/microscope-materials.js`
- Create: `tests/microscope-materials.test.mjs`

- [ ] **Step 1: Write failing tests for role coverage and assignment**

```js
test("material roles cover all 42 exported microscope meshes", () => {
  assert.equal(Object.keys(MICROSCOPE_MATERIAL_ROLES).length, 42);
  for (let index = 0; index < 42; index += 1) {
    assert.ok(MICROSCOPE_MATERIAL_ROLES[`tripo_part_${index}`]);
  }
});

test("applyMicroscopeMaterials assigns mapped and fallback materials", () => {
  const assigned = [];
  const model = { traverse(callback) { assigned.forEach(callback); } };
  assigned.push({ isMesh: true, name: "tripo_part_0", material: { dispose() {} } });
  assigned.push({ isMesh: true, name: "unknown", material: { dispose() {} } });
  applyMicroscopeMaterials(model, { painted: "painted", fallback: "fallback" });
  assert.equal(assigned[0].material, "painted");
  assert.equal(assigned[1].material, "fallback");
});
```

- [ ] **Step 2: Run the new test and verify the missing module fails**

Run: `node --test tests/microscope-materials.test.mjs`

Expected: FAIL because `src/microscope-materials.js` does not exist.

- [ ] **Step 3: Implement the palette factory and assignment function**

Export `MATERIAL_ROLES`, `MICROSCOPE_MATERIAL_ROLES`, `createMicroscopeMaterials`, and `applyMicroscopeMaterials`. Use `MeshStandardMaterial` for opaque roles and `MeshPhysicalMaterial` for glass. Dispose each replaced source material once.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/microscope-materials.test.mjs`

Expected: PASS.

### Task 2: Identify Mesh Parts

**Files:**
- Temporarily modify: `src/main.js`
- Modify: `src/microscope-materials.js`

- [ ] **Step 1: Add a temporary diagnostic assignment**

Assign a unique high-contrast HSL color to each `tripo_part_N` mesh when the local page includes `?diagnosticMaterials=1`.

- [ ] **Step 2: Capture desktop views**

Use the local browser to capture front-left, side, rear, and top-biased screenshots. Match each visible diagnostic color to its `tripo_part_N` index.

- [ ] **Step 3: Replace provisional roles with the reviewed map**

Map every mesh to one of: `painted`, `polished`, `darkMetal`, `blackPolymer`, `glass`, or `brass`.

- [ ] **Step 4: Remove diagnostic runtime code**

No diagnostic query parameter or diagnostic materials remain in production files.

### Task 3: Integrate and Tune Rendering

**Files:**
- Modify: `src/main.js`
- Modify: `src/viewer.js`
- Test: `tests/microscope-materials.test.mjs`
- Test: `tests/static-site.test.mjs`

- [ ] **Step 1: Apply materials after model load**

```js
const materials = createMicroscopeMaterials();
const microscopeViewer = createModelViewer({
  container: document.getElementById("microscope-viewer"),
  modelUrl: "./assets/models/source/travelling-microscope-source.glb",
  onLoaded({ model }) {
    applyMicroscopeMaterials(model, materials);
  },
});
```

- [ ] **Step 2: Add a static integration assertion**

Assert that `src/main.js` imports and calls both material functions while continuing to load only the supplied microscope model.

- [ ] **Step 3: Tune tone mapping and lights**

Enable ACES filmic tone mapping, use a restrained exposure, and lower the existing light intensities until silver surfaces retain visible highlights without clipping to white.

- [ ] **Step 4: Run all tests and syntax checks**

Run: `npm.cmd test`, `node --check src/main.js`, `node --check src/viewer.js`, and `git diff --check`.

Expected: all commands exit 0.

### Task 4: Visual Verification and Deployment

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Verify desktop reference views**

Confirm silver body, dark rails, black controls, polished drums, and cyan glass are all visible. Confirm the model remains rotatable, zoomable, and resettable.

- [ ] **Step 2: Verify mobile layout and canvas pixels**

At 390 x 844, confirm one canvas, no horizontal overflow, hidden loading state, and nonblank color regions. Programmatically verify the screenshot is not dominated by clipped white pixels.

- [ ] **Step 3: Update model documentation**

Document that materials are applied at runtime from photographed references and that the original GLB remains unchanged.

- [ ] **Step 4: Commit and push**

```bash
git add src/microscope-materials.js src/main.js src/viewer.js tests/microscope-materials.test.mjs tests/static-site.test.mjs README.md
git commit -m "feat: color microscope model from references"
git push origin master:main
```

- [ ] **Step 5: Verify GitHub Pages**

Confirm remote `main`, successful Pages deployment, one rendered canvas, and no browser errors.
