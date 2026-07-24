# Microscope Material Coloring Design

## Goal

Color the existing 42-mesh microscope model to match the supplied photographs while preserving the original GLB bytes and the single-model viewer behavior.

## Reference Palette

- Painted cast body: cool silver-gray, moderately rough with a restrained metallic response.
- Machined controls and scale drums: brighter silver with lower roughness.
- Rails and dark metal housings: charcoal gray with a subtle metallic response.
- Knobs, eyepiece rings, and rubber parts: near-black with low metalness.
- Stage plate: pale cyan glass with transparency and low roughness.
- Small warm fasteners: muted brass where the reference photographs support it.

The photographs do not provide reusable UV textures. Printed scales, labels, scratches, and serial plates are outside this coloring pass because inventing them would reduce visual accuracy.

## Architecture

- Keep `assets/models/source/travelling-microscope-source.glb` unchanged.
- Add `src/microscope-materials.js` containing named Three.js materials and an explicit map from `tripo_part_N` mesh names to material roles.
- Call the coloring function from `src/main.js` through the existing viewer `onLoaded` callback.
- Tune renderer lighting and tone mapping only as needed to prevent the silver materials from clipping to white.
- Do not add model-editing controls or expose diagnostic mesh IDs in the finished interface.

## Mesh Identification

Create a temporary diagnostic material mode that assigns a unique high-contrast color to each mesh. Capture several browser views and compare them with the five reference photographs. Convert the result into an explicit, reviewed material map, then remove the diagnostic mode from production code.

Every visible mesh must be assigned exactly one material role. Uncertain small meshes default to the nearest parent assembly's material instead of receiving arbitrary accent colors.

## Material Behavior

- Use separate material instances for painted metal, polished metal, dark metal, black polymer, glass, and brass.
- Use `MeshStandardMaterial` for opaque parts and `MeshPhysicalMaterial` for glass.
- Preserve geometry, transforms, shadows, camera framing, orbit controls, and reset behavior.
- Dispose replaced source materials after assignment to avoid retaining unused GPU resources.

## Verification

- Unit tests verify palette roles, complete mapping coverage for `tripo_part_0` through `tripo_part_41`, and fallback behavior.
- Existing static and GLB integrity tests continue to pass.
- Browser verification confirms one nonblank canvas, no loading errors, and no horizontal overflow.
- Desktop screenshots cover front-left, rear, side, and top-biased views; a 390 px viewport confirms mobile rendering.
- Pixel checks confirm the render contains silver, dark, black, and glass-tinted regions rather than a nearly all-white model.

## Deployment

Commit the material module, integration, tests, and any minimal lighting changes to the existing repository. Push `master` to `origin/main` and verify the GitHub Pages deployment against the new commit.
