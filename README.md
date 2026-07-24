# Microscope 3D Viewer

一个只展示显微镜模型的静态三维查看页。模型可以旋转、缩放和复位，桌面端与手机端均可使用。

在线查看：<https://qing-shi667.github.io/newton-ring-3d-viewer/>

## Local Preview

需要 Node.js 20.11 或更高版本。

```bash
npm install
npm start
```

打开 `http://127.0.0.1:8050/`。

## Project Files

- `index.html` and `styles.css`: responsive page layout.
- `src/viewer.js`: Three.js viewer setup and camera controls.
- `src/microscope-geometry.js`: stage-clip replacement logic.
- `src/microscope-surface-corrections.js`: display-only rail and plaque material corrections.
- `src/texture-recolor.js`: blue-to-silver pixel transform used by the texture generator.
- `assets/models/source/travelling-microscope-textured.glb`: the uploaded textured microscope displayed by the page.
- `assets/models/source/stage-clip-source.glb`: the corrected black stage-clip donor.
- `assets/textures/microscope/tripo-part-1-silver.jpg`: generated silver-gray visible-rail texture.
- `assets/textures/microscope/tripo-part-16-silver.jpg`: generated silver-gray rail texture.
- `scripts/export-stage-clip.mjs`: reproducibly exports the donor from the original microscope source.
- `scripts/generate-microscope-surface-textures.mjs`: reproducibly generates the rail texture.

## Model

The uploaded textured microscope GLB is stored without changing its bytes. The viewer keeps all 41 embedded materials and JPEG textures, so labels, surface details, and photographed colors remain part of the displayed model.

At runtime, only the two original stage-clip nodes are hidden. The page inserts the corrected black donor clip and a Z-axis mirrored copy around the glass-stage center. No other mesh or material in the textured model is replaced.

The viewer converts the blue areas of `tripo_part_1` and `tripo_part_16` to silver gray while preserving their shading, and recolors the separate information and brand plaques (`tripo_part_11` and `tripo_part_30`) to match the surrounding body. These are runtime display corrections; the uploaded GLB remains byte-identical.

## GitHub Pages

This is a static site and does not need a server or API. Push the repository to GitHub, choose the default branch root as the Pages source, and open the generated Pages URL. All model paths are relative, so the page also works when served from a project subpath.

The displayed GLB is below GitHub's 100 MB per-file limit, but its first load may still take time on a slower network.

## Attribution And Limitations

The supplied GLB is retained as a source asset for browser viewing and is not an editable CAD assembly.
