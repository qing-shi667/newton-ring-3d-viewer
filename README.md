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
- `assets/models/source/travelling-microscope-source.glb`: the supplied microscope GLB displayed by the page.

## Model

The supplied microscope GLB is loaded directly without mesh cleanup or additional procedural geometry.

## GitHub Pages

This is a static site and does not need a server or API. Push the repository to GitHub, choose the default branch root as the Pages source, and open the generated Pages URL. All model paths are relative, so the page also works when served from a project subpath.

The displayed GLB is below GitHub's 100 MB per-file limit, but its first load may still take time on a slower network.

## Attribution And Limitations

The supplied GLB is retained as a source asset for browser viewing and is not an editable CAD assembly.
