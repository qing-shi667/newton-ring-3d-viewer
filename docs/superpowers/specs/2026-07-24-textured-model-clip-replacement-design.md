# Textured Microscope Clip Replacement Design

## Objective

Use `tripo_convert_3656e292-6561-4910-a7a0-5d4a7aade425.glb` as the displayed microscope while preserving all of its embedded textures and materials. Replace only its two stage clips with the corrected clip geometry currently displayed by the site.

## Assets

- Copy the new 62.99 MB textured GLB into the site's source-model assets under a stable filename.
- Keep the uploaded textured GLB bytes unchanged after copying.
- Export `tripo_part_28` from the current microscope source as a small clip-only GLB.
- Give the clip-only asset a black material matching the current viewer.
- Keep the existing untextured source GLB unchanged for provenance and regression checks.

## Runtime Flow

1. Load the new textured microscope as the only full model.
2. Preserve every material supplied by that GLB; do not run whole-model material reassignment.
3. Hide the textured model's original clip meshes, `tripo_part_9` and `tripo_part_28`.
4. Load the clip-only GLB.
5. Place one clip at the corrected left position.
6. Mirror a clone across the textured glass stage's Z center, using `tripo_part_17` as the stage reference.
7. Keep both clip mounting points on the same rear edge and use the same black material.
8. Frame the completed assembly after both replacement clips are present.

## Failure Handling

- If the textured model fails to load, show the existing model-load error state.
- If the clip-only asset fails to load, keep the textured model visible and report that the replacement clips failed to load.
- If any required node is missing, skip the replacement instead of moving unrelated geometry.

## Testing

- Verify the site loads the stable textured-model filename.
- Verify no whole-model material reassignment runs on the textured model.
- Verify the two original textured clip nodes are hidden.
- Verify the donor clip is inserted twice with matching black material.
- Verify both clips share their rear-edge coordinate and are mirrored only along the stage's left-right axis.
- Verify both GLB files have valid headers and remain below GitHub's 100 MB per-file limit.
- Verify the uploaded textured GLB copy has the same hash as the source file.
- Run the full existing test suite and syntax checks.

## Non-Goals

- Do not recolor or remesh any other part of the textured microscope.
- Do not edit the embedded textures.
- Do not alter the camera controls or page layout.
- Do not push the result until the user has inspected the local preview.
