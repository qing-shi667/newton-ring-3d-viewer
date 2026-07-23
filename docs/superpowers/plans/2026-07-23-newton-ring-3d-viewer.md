# Newton Ring 3D Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Pages-ready site with independently controlled, side-by-side viewers for a cleaned Newton ring instrument and a completed travelling microscope.

**Architecture:** A Node preprocessing script parses the Newton ring GLB, identifies disconnected mesh components, and exports a cleaned GLB without the unwanted base and floating fragments. A static Three.js application loads the cleaned model and original microscope, adds the missing microscope assembly as procedural geometry, and gives each viewport its own renderer, camera, controls, progress, and reset state.

**Tech Stack:** Node.js, Three.js ES modules, GLTFLoader, OrbitControls, native HTML/CSS/JavaScript, Node test runner, GitHub Pages.

---

## File Map

- `package.json`: scripts and pinned development dependencies.
- `scripts/analyze-glb.mjs`: lists disconnected mesh components and bounds for model-cleaning decisions.
- `scripts/clean-newton-model.mjs`: removes selected disconnected components and writes the cleaned GLB.
- `scripts/model-cleaning-config.json`: records removal rules and component IDs so processing is reproducible.
- `tests/model-cleaning.test.mjs`: verifies component analysis and cleaned-output invariants.
- `index.html`: semantic page shell and two viewer containers.
- `styles.css`: responsive two-column/stacked presentation and stable viewport dimensions.
- `src/main.js`: starts both independent viewers.
- `src/viewer.js`: renderer, camera, lighting, loading, framing, controls, resize, and reset behavior.
- `src/microscope-parts.js`: builds and positions the missing microscope lower assembly.
- `tests/static-site.test.mjs`: checks required page elements, asset paths, and module contracts.
- `assets/models/source/`: untouched source GLBs.
- `assets/models/newton-ring-clean.glb`: generated display model.
- `vendor/three/`: pinned browser modules required for offline and GitHub Pages loading.
- `README.md`: local preview and GitHub Pages publishing instructions.

### Task 1: Repository Foundation

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tests/static-site.test.mjs`
- Create: `assets/models/source/newton-ring-source.glb`
- Create: `assets/models/source/travelling-microscope-source.glb`

- [ ] **Step 1: Copy the two source GLBs without modifying the originals**

Run PowerShell `Copy-Item` with literal source and destination paths. Verify SHA-256 hashes of source and copied files are identical.

- [ ] **Step 2: Write the first failing repository test**

Use the Node test runner to assert that both source model files exist, have GLB magic bytes, and remain below the GitHub 100 MB per-file limit.

- [ ] **Step 3: Add package scripts and ignore generated inspection output**

Define `test`, `analyze:model`, and `clean:model` scripts. Ignore `.superpowers/`, `tmp/`, and rendered screenshot output while keeping the generated cleaned GLB tracked.

- [ ] **Step 4: Run the foundation test**

Run: `npm test`

Expected: source-asset checks pass and later page checks fail because the site has not been created.

- [ ] **Step 5: Commit**

Run: `git add .gitignore package.json tests assets/models/source && git commit -m "chore: add source model assets"`

### Task 2: GLB Component Analysis And Cleaning

**Files:**
- Create: `scripts/glb-utils.mjs`
- Create: `scripts/analyze-glb.mjs`
- Create: `scripts/clean-newton-model.mjs`
- Create: `scripts/model-cleaning-config.json`
- Create: `tests/model-cleaning.test.mjs`
- Create: `assets/models/newton-ring-clean.glb`

- [ ] **Step 1: Write failing tests for GLB parsing and component filtering**

Tests must assert that `readGlb()` reads the JSON and BIN chunks, `findConnectedComponents()` returns multiple components with bounds, and `filterPrimitive()` removes configured component triangles while retaining valid indices and vertex attributes.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/model-cleaning.test.mjs`

Expected: FAIL because `scripts/glb-utils.mjs` does not exist.

- [ ] **Step 3: Implement GLB parsing and connected-component analysis**

Parse accessor component types, byte offsets, strides, triangle indices, position bounds, vertex-to-component assignment, component triangle counts, and referenced texture-coordinate statistics. Keep functions pure so tests can use synthetic fixtures.

- [ ] **Step 4: Analyze the real Newton ring model**

Run: `npm run analyze:model`

Expected: a JSON report containing component IDs, vertex counts, triangle counts, bounds, centroids, and average sampled base-color values. Use this report and rendered inspection views to identify the bottom brown mass and detached floating islands.

- [ ] **Step 5: Record explicit removal IDs and guard conditions**

Store selected component IDs plus expected bounds/counts in `scripts/model-cleaning-config.json`. The cleaner must stop with an error if the source hash or selected component bounds differ, preventing accidental deletion from a changed source file.

- [ ] **Step 6: Implement cleaned GLB export**

Retain shared vertex/accessor buffers and rewrite the triangle index accessor and buffer view for kept triangles. Update accessor count, min/max metadata, buffer lengths, and GLB 4-byte padding. Preserve material, texture, normals, and UVs.

- [ ] **Step 7: Generate and test the cleaned model**

Run: `npm run clean:model && node --test tests/model-cleaning.test.mjs`

Expected: PASS; output opens as GLB, has fewer triangles than the source, contains no selected components, preserves the source material/texture, and is below 100 MB.

- [ ] **Step 8: Commit**

Run: `git add scripts tests/model-cleaning.test.mjs assets/models/newton-ring-clean.glb && git commit -m "feat: clean newton ring model"`

### Task 3: Static Dual-Viewer Interface

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/main.js`
- Create: `src/viewer.js`
- Create: `vendor/three/three.module.js`
- Create: `vendor/three/GLTFLoader.js`
- Create: `vendor/three/OrbitControls.js`
- Modify: `tests/static-site.test.mjs`

- [ ] **Step 1: Write failing page-contract tests**

Assert that the document contains two labeled viewer regions, two canvases created by modules, independent reset buttons, loading/error status elements, and relative paths to the cleaned Newton model and microscope source model.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test`

Expected: FAIL because `index.html`, `src/main.js`, and `src/viewer.js` do not exist.

- [ ] **Step 3: Build the page shell and responsive layout**

Create a restrained teaching-tool interface with a compact title band, two un-nested model panels, stable `aspect-ratio` viewports, icon reset controls with tooltips, visible status overlays, and a breakpoint that stacks panels on mobile.

- [ ] **Step 4: Implement reusable independent viewers**

`createModelViewer(options)` must create a renderer and camera for one container, install OrbitControls, add neutral studio lighting and ground reference, load one GLB with progress reporting, normalize scale, frame the bounding box, expose `reset()`, and resize through `ResizeObserver`.

- [ ] **Step 5: Start both viewers independently**

Instantiate the Newton viewer with `assets/models/newton-ring-clean.glb` and microscope viewer with `assets/models/source/travelling-microscope-source.glb`. A load failure in either viewer must not stop the other.

- [ ] **Step 6: Run tests**

Run: `npm test`

Expected: PASS for static contracts and model-cleaning tests.

- [ ] **Step 7: Commit**

Run: `git add index.html styles.css src vendor tests/static-site.test.mjs && git commit -m "feat: add independent dual model viewers"`

### Task 4: Complete The Travelling Microscope

**Files:**
- Create: `src/microscope-parts.js`
- Modify: `src/main.js`
- Modify: `src/viewer.js`
- Modify: `tests/static-site.test.mjs`

- [ ] **Step 1: Write failing assembly-contract tests**

Assert that `createMicroscopeLowerAssembly()` exists, returns one named Three.js group, and is registered as the microscope viewer's post-load addition.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test`

Expected: FAIL because `src/microscope-parts.js` does not exist.

- [ ] **Step 3: Build the missing assembly**

Construct the lower support bracket from box geometry, the connector from cylinders/cones, the circular viewing element from torus/cylinder geometry, and the large adjustment wheel from cylinders with repeated grip ribs. Use neutral grey metal, dark controls, and subtle roughness variation.

- [ ] **Step 4: Align the assembly to model-local bounds**

After loading the microscope, compute its normalized bounding box and attach the assembly at a position expressed as proportions of width, height, and depth. Keep all offsets in one exported configuration object for quick visual adjustment.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS, including the assembly registration contract.

- [ ] **Step 6: Commit**

Run: `git add src tests/static-site.test.mjs && git commit -m "feat: complete microscope lower assembly"`

### Task 5: Visual And Interaction Verification

**Files:**
- Modify: `scripts/model-cleaning-config.json`
- Modify: `src/microscope-parts.js`
- Modify: `styles.css`
- Create: `README.md`

- [ ] **Step 1: Start a local static server**

Run a local server on an unused port and open the page in the in-app browser.

- [ ] **Step 2: Inspect the cleaned Newton model from multiple angles**

Capture front, rear, side, top, and underside screenshots. If brown base or floating fragments remain, update only the explicit component removal list, regenerate the GLB, and rerun tests.

- [ ] **Step 3: Align the microscope addition**

Compare the lower assembly against the supplied three reference screenshots. Adjust only the centralized proportions/configuration until the bracket, circular element, connector, and adjustment wheel read as one coherent instrument.

- [ ] **Step 4: Verify interaction and canvas pixels**

Confirm both canvases contain non-background pixels, rotate and zoom each model separately, use both reset buttons, and verify one viewport remains unchanged while interacting with the other.

- [ ] **Step 5: Verify responsive layouts**

Capture desktop and mobile screenshots. Confirm desktop is two columns, mobile is one column, text fits, controls do not overlap, canvases remain stable, and both models are framed.

- [ ] **Step 6: Document usage**

Write `README.md` with project purpose, source/cleaned asset distinction, local server command, controls, model-processing command, performance expectations, and GitHub Pages deployment steps.

- [ ] **Step 7: Run final local verification**

Run: `npm test`

Expected: all tests PASS and the local page returns HTTP 200 for HTML, scripts, and both GLBs.

- [ ] **Step 8: Commit**

Run: `git add scripts/model-cleaning-config.json src/microscope-parts.js styles.css README.md && git commit -m "docs: verify and document 3d viewer"`

### Task 6: GitHub Publication

**Files:**
- Modify: `README.md` only if the final public URL differs from the documented placeholder.

- [ ] **Step 1: Confirm repository cleanliness and asset sizes**

Run: `git status --short` and list all tracked files over 50 MB. Expected: clean worktree; no tracked file reaches 100 MB.

- [ ] **Step 2: Create the GitHub repository**

Create public repository `newton-ring-3d-viewer` under the user's authenticated GitHub account, add it as `origin`, and push the default branch.

- [ ] **Step 3: Enable GitHub Pages**

Publish from the default branch root and wait for the Pages deployment to report success.

- [ ] **Step 4: Verify the public site**

Open the Pages URL, confirm both models load, and repeat one rotate/zoom/reset interaction in each viewport.

- [ ] **Step 5: Record final URL**

Update `README.md` if necessary, commit, push, and report the public GitHub repository and Pages URLs.
