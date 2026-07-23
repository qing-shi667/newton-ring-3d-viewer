# Single Microscope Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-instrument page with one responsive viewer that displays only the newly supplied microscope GLB.

**Architecture:** Reuse the existing `createModelViewer` Three.js component and its relative asset loading. Reduce the entry point and HTML to one microscope instance, remove the runtime procedural assembly, and constrain the single panel with responsive CSS.

**Tech Stack:** Static HTML/CSS, JavaScript modules, Three.js 0.180.0, Node.js test runner, GitHub Pages.

---

### Task 1: Lock Single-Viewer Behavior

**Files:**
- Modify: `tests/static-site.test.mjs`

- [ ] **Step 1: Replace the two-viewer assertions with a failing single-viewer test**

```js
test("page exposes only the microscope viewer", async () => {
  const html = await read("index.html");
  assert.doesNotMatch(html, /id="newton-viewer"/);
  assert.match(html, /id="microscope-viewer"/);
  assert.equal((html.match(/data-action="reset"/g) ?? []).length, 1);
});

test("main module loads only the supplied microscope model", async () => {
  const source = await read("src/main.js");
  assert.match(source, /travelling-microscope-source\.glb/);
  assert.doesNotMatch(source, /newton-ring-clean\.glb/);
  assert.doesNotMatch(source, /createMicroscopeLowerAssembly/);
});
```

- [ ] **Step 2: Run the static test and verify it fails for the existing Newton ring viewer**

Run: `node --test tests/static-site.test.mjs`

Expected: FAIL because `index.html` still contains `newton-viewer` and `src/main.js` still loads `newton-ring-clean.glb`.

### Task 2: Implement the Single Microscope Page

**Files:**
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `styles.css`
- Modify: `README.md`
- Test: `tests/static-site.test.mjs`

- [ ] **Step 1: Reduce the page markup to one microscope panel**

Use one `main.viewer-shell`, one `section.model-panel`, one reset button with `data-viewer="microscope"`, and one `#microscope-viewer` container. Update the title and header copy to `显微镜 3D 模型` and `MICROSCOPE 3D VIEWER`.

- [ ] **Step 2: Load the microscope GLB without procedural geometry**

```js
import { createModelViewer } from "./viewer.js";

const microscopeViewer = createModelViewer({
  container: document.getElementById("microscope-viewer"),
  modelUrl: "./assets/models/source/travelling-microscope-source.glb",
});

document.querySelector('[data-action="reset"]').addEventListener("click", () => {
  microscopeViewer.reset();
});

window.microscopeViewerReady = true;
```

- [ ] **Step 3: Constrain the single viewer responsively**

Change the grid to a centered single-column shell with `width: min(100%, 1100px)` and keep a `4 / 3` viewport on desktop. At widths below 780px, keep one column and reduce the viewport minimum height to 300px without horizontal overflow.

- [ ] **Step 4: Update the README to describe one untouched microscope asset**

Remove claims that the page displays Newton rings or adds a procedural lower assembly. Document the new model path and retain local preview and GitHub Pages instructions.

- [ ] **Step 5: Run the complete test suite**

Run: `npm.cmd test`

Expected: 8 tests pass with 0 failures.

### Task 3: Verify and Deploy

**Files:**
- Replace: `assets/models/source/travelling-microscope-source.glb`

- [ ] **Step 1: Verify JavaScript syntax and repository diff**

Run: `node --check src/main.js` and `git diff --check`.

Expected: both commands exit 0.

- [ ] **Step 2: Verify the local browser at desktop and mobile widths**

Confirm one canvas, one hidden loading state after completion, a visibly nonblank microscope render, no Newton ring panel, and no horizontal overflow at 390 px.

- [ ] **Step 3: Commit the implementation**

```bash
git add index.html styles.css src/main.js README.md tests/static-site.test.mjs assets/models/source/travelling-microscope-source.glb
git commit -m "feat: publish single microscope model viewer"
```

- [ ] **Step 4: Push and verify GitHub Pages**

Run: `git push origin master:main`.

Expected: the public page creates one canvas and renders the new microscope GLB without browser errors.
