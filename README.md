# Newton Ring 3D Viewer

一个面向牛顿环曲率半径实验的静态三维查看页。页面把清理后的牛顿环仪和补齐下部结构的读数显微镜左右并排展示，两个模型可以独立旋转、缩放和复位。

## Local Preview

需要 Node.js 18 或更高版本。

```bash
npm install
npm start
```

打开 `http://127.0.0.1:8050/`。

## Project Files

- `index.html` and `styles.css`: responsive page layout.
- `src/viewer.js`: independent Three.js viewer setup and camera controls.
- `src/microscope-parts.js`: procedural lower assembly added to the microscope.
- `assets/models/newton-ring-clean.glb`: cleaned Newton ring display asset.
- `assets/models/source/`: untouched source GLB files.
- `scripts/clean-newton-model.mjs`: reproducible Newton ring mesh filtering.
- `scripts/model-cleaning-config.json`: source hash and removed component IDs.

## Model Processing

The source models are merged GLB meshes rather than editable CAD assemblies. The original files are preserved. The Newton ring cleaner removes the configured bottom-base and floating geometry components while preserving the texture and remaining triangle attributes.

```bash
npm run analyze:model
npm run clean:model
npm test
```

The microscope lower assembly is generated at runtime from Three.js primitives so it moves with the loaded microscope as one group.

## GitHub Pages

This is a static site and does not need a server or API. Push the repository to GitHub, choose the default branch root as the Pages source, and open the generated Pages URL. All model paths are relative, so the page also works when served from a project subpath.

The two source GLBs and the cleaned GLB are each below GitHub's 100 MB per-file limit, but the models are still large. The first load may take time on a slower network.

## Attribution And Limitations

The supplied GLB assets are retained as source assets. The cleanup is intended for visual teaching display; because the source files are generated merged meshes, it does not recreate editable SolidWorks part structure or guarantee metrology-grade dimensions.
