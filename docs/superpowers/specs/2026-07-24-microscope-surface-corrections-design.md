# Microscope Surface Corrections Design

## Objective

Keep the uploaded textured microscope GLB byte-identical while making three display-only corrections in the web viewer:

- Convert the blue rail on `tripo_part_16` to silver gray while preserving its original highlights and shadows.
- Recolor the white information plaque `tripo_part_11` to match the nearby body surface.
- Recolor the black brand plaque `tripo_part_30` to match the nearby body surface.

The changes remain local until the user inspects the preview and explicitly asks to push.

## Approach

The blue rail uses a shared texture atlas with other dark areas, so the page must not replace its whole mesh material. A generated texture copy will convert only pixels that meet the blue-color mask into neutral silver-gray values derived from their existing luminance. All non-blue pixels remain unchanged. The generated texture is assigned only to a clone of `tripo_part_16`'s existing material.

The two plaques are separate meshes. The page will replace their materials with two neutral, low-metalness silver-gray `MeshStandardMaterial` instances, tuned independently for the darker base body (`tripo_part_11`) and the lighter column body (`tripo_part_30`). Their geometry remains in place, so there are no holes in the model.

## Assets And Runtime Flow

1. Add a reproducible script that extracts the `tripo_part_16` source JPEG from the textured GLB and writes a recolored JPEG under `assets/textures/microscope/`.
2. The script leaves the source GLB unchanged and preserves all non-blue source pixels.
3. After the textured model and stage clips load, load the generated rail texture.
4. Clone `tripo_part_16`'s material, assign the generated texture with sRGB color space and `flipY = false`, then assign the clone to that mesh only.
5. Replace the materials of `tripo_part_11` and `tripo_part_30` only.
6. If a target mesh or generated texture is unavailable, leave that target's original material intact and report the missed target without failing model display.

## Verification

- Unit-test the blue-pixel recoloring transform and verify non-blue pixels are unchanged.
- Test the runtime correction helper with a Three.js scene containing the three named target meshes.
- Test that the generated JPEG is publishable and decodable.
- Keep the existing textured-model hash check, full test suite, syntax checks, and local preview.

## Non-Goals

- Do not edit the uploaded GLB, its embedded JPEGs, or any non-target mesh.
- Do not smooth the rippled column mesh in this change.
- Do not alter the corrected black stage clips, camera controls, or page layout.
