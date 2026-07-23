# Single Microscope Viewer Design

## Goal

Publish the newly supplied `显微镜3d模型.glb` as the only model on the existing GitHub Pages site.

## Page

- Show one full-width viewer titled `显微镜 3D 模型`.
- Keep orbit rotation, wheel or pinch zoom, and the reset-view button.
- Remove the Newton ring panel and all Newton-ring-specific page copy.
- Preserve the existing quiet laboratory-viewer visual style and responsive behavior.

## Model Loading

- Store the supplied GLB at the existing web-safe path `assets/models/source/travelling-microscope-source.glb`.
- Load the GLB directly with the shared Three.js viewer.
- Do not modify the GLB and do not add the previous procedural lower assembly.
- Keep visible loading and startup error states.

## Verification

- Static tests require exactly one viewer region and one reset control.
- Static tests require the microscope model path and reject Newton-ring or procedural-assembly loading in `src/main.js`.
- The supplied GLB must retain a valid `glTF` header and stay below GitHub's 100 MB file limit.
- Browser checks must confirm one nonblank canvas on desktop and mobile widths, with no horizontal overflow.

## Deployment

Commit the model and viewer changes to the existing repository and push `master` to `origin/main` so GitHub Pages updates in place.
