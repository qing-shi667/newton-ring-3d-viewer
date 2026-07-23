# Newton Ring 3D Viewer Design

## Goal

Create a static browser experience that presents the Newton ring instrument and travelling microscope side by side. Each model must support independent rotation, zoom, and view reset. The finished project must be suitable for GitHub Pages and require no backend.

## Source Assets

- Newton ring instrument: copied into the repository as `newton-ring-source.glb`.
- Travelling microscope: copied into the repository as `travelling-microscope-source.glb`.

Both source files are generated GLB assets containing one node and one merged mesh. They are not CAD assemblies and do not expose removable named parts. The original files will remain unchanged under `assets/models/source/`.

## Model Processing

### Newton Ring Instrument

Generate a separate cleaned GLB for display. Processing will:

1. Detect disconnected geometry islands and calculate their bounding boxes.
2. Remove the brown mass below the useful instrument body using spatial position and texture/color evidence.
3. Remove detached floating fragments that do not belong to the useful instrument body.
4. Preserve the ring holder and other connected experimental structures.
5. Validate the cleaned mesh from several camera angles before publishing it.

Because the source is a merged AI-generated mesh, this is visual model cleanup rather than restoration of editable CAD parts.

### Travelling Microscope

Keep the source GLB intact. Add the missing lower assembly at runtime with Three.js geometry, following the supplied reference screenshots. The addition will include the lower support bracket, cylindrical connector, circular viewing/adjustment element, and the large knurled adjustment wheel. Materials will match the source model's neutral metal and black controls.

The added assembly will be grouped with the microscope so rotation, zoom, framing, and reset treat it as one object.

## Browser Experience

The page will use two side-by-side 3D viewports:

- Left viewport: cleaned Newton ring instrument.
- Right viewport: completed travelling microscope.

Each viewport will provide independent orbit rotation, wheel/pinch zoom, drag pan where appropriate, and a reset-view button. Loading, failure, and unsupported-WebGL states will be visible and will not shift the layout.

On mobile, the viewports will stack vertically because two usable 3D controls cannot fit side by side at narrow widths. Desktop and tablet layouts will remain side by side.

## Architecture

- Static HTML, CSS, and JavaScript.
- Three.js and GLTFLoader for rendering GLB assets.
- OrbitControls for camera interaction.
- No API, database, authentication, or backend.
- GitHub Pages-compatible relative asset paths.

The application will separate viewer setup, model loading, procedural microscope additions, and responsive UI behavior into focused modules where the final project structure justifies it.

## Performance

The two source models total approximately 101 MB and contain about 1.9 million vertices. The published assets will be simplified and compressed where practical while preserving visible details. The page will load each model independently, show progress, and avoid blocking one viewport when the other is ready.

## Validation

Validation will include:

- The brown base and floating Newton ring fragments are absent from all inspected angles.
- The useful Newton ring structure remains intact.
- The microscope lower assembly aligns with the reference screenshots and moves with the model.
- Both viewports render nonblank and support independent rotation, zoom, and reset.
- Desktop and mobile screenshots show no overlap or clipped controls.
- The site works from a local static server and from relative GitHub Pages paths.

## Repository And Publishing

The local repository will be `newton-ring-3d-viewer`. After local approval, it will be pushed to a new GitHub repository and configured for GitHub Pages. Large-file constraints will be checked before push; processed assets should remain below GitHub's per-file limit.
