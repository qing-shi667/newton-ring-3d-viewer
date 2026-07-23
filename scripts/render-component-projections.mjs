import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import jpeg from "jpeg-js";
import { findConnectedComponents, readAccessor, readGlb } from "./glb-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const outputDir = resolve(root, "tmp/projections");
await mkdir(outputDir, { recursive: true });

const input = process.argv.find((argument, index) => index >= 2 && !argument.startsWith("--"))
  ?? "assets/models/source/newton-ring-source.glb";
const idsOnly = process.argv.includes("--ids-only");
const glb = await readGlb(resolve(root, input));
const primitive = glb.json.meshes[0].primitives[0];
const positions = readAccessor(glb, primitive.attributes.POSITION);
const uvs = readAccessor(glb, primitive.attributes.TEXCOORD_0);
const components = findConnectedComponents(glb, primitive);
const vertexComponent = new Uint32Array(positions.accessor.count).fill(0xffffffff);
for (const component of components) {
  for (const vertex of component.vertices) vertexComponent[vertex] = component.id;
}

let texture = null;
if (!idsOnly) {
  const imageView = glb.json.bufferViews[glb.json.images[0].bufferView];
  const imageStart = imageView.byteOffset ?? 0;
  texture = jpeg.decode(glb.binary.subarray(imageStart, imageStart + imageView.byteLength), {
    useTArray: true,
    formatAsRGBA: true,
  });
}

function textureColor(vertex) {
  if (!texture) return componentColor(vertexComponent[vertex]);
  const uv = uvs.read(vertex);
  const x = Math.max(0, Math.min(texture.width - 1, Math.round(uv[0] * (texture.width - 1))));
  const y = Math.max(0, Math.min(texture.height - 1, Math.round((1 - uv[1]) * (texture.height - 1))));
  const offset = (y * texture.width + x) * 4;
  return [texture.data[offset], texture.data[offset + 1], texture.data[offset + 2]];
}

const colorStats = components.map(() => ({ count: 0, sum: [0, 0, 0] }));
for (let vertex = 0; vertex < positions.accessor.count; vertex += 1) {
  if (vertexComponent[vertex] === 0xffffffff) continue;
  const stat = colorStats[vertexComponent[vertex]];
  const color = textureColor(vertex);
  stat.count += 1;
  for (let channel = 0; channel < 3; channel += 1) stat.sum[channel] += color[channel];
}

const report = components.map(({ vertices, root, ...component }) => {
  const stat = colorStats[component.id];
  return {
    ...component,
    averageRgb: stat.sum.map((value) => Math.round(value / stat.count)),
  };
});
await writeFile(resolve(outputDir, "components.json"), JSON.stringify(report, null, 2));

const width = 1200;
const height = 900;
const views = [
  { name: "front", horizontal: 0, vertical: 1, depth: 2 },
  { name: "side", horizontal: 2, vertical: 1, depth: 0 },
  { name: "top", horizontal: 0, vertical: 2, depth: 1 },
];

const glyphs = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

function componentColor(id) {
  return [70 + (id * 97) % 170, 70 + (id * 53) % 170, 70 + (id * 29) % 170];
}

function drawLabel(pixels, x, y, text) {
  const scale = 2;
  const labelWidth = text.length * 8 + 4;
  const startX = Math.max(0, Math.min(width - labelWidth, Math.round(x - labelWidth / 2)));
  const startY = Math.max(0, Math.min(height - 16, Math.round(y - 8)));
  for (let py = 0; py < 14; py += 1) {
    for (let px = 0; px < labelWidth; px += 1) {
      const offset = ((startY + py) * width + startX + px) * 4;
      pixels[offset] = 255;
      pixels[offset + 1] = 255;
      pixels[offset + 2] = 255;
      pixels[offset + 3] = 255;
    }
  }
  [...text].forEach((character, characterIndex) => {
    const glyph = glyphs[character];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((bit, columnIndex) => {
        if (bit !== "1") return;
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const px = startX + 2 + characterIndex * 8 + columnIndex * scale + sx;
            const py = startY + 2 + rowIndex * scale + sy;
            const offset = (py * width + px) * 4;
            pixels[offset] = 20;
            pixels[offset + 1] = 24;
            pixels[offset + 2] = 26;
            pixels[offset + 3] = 255;
          }
        }
      });
    });
  });
}

for (const view of views) {
  const pixels = Buffer.alloc(width * height * 4, 242);
  const idPixels = Buffer.alloc(width * height * 4, 242);
  const depth = new Float32Array(width * height).fill(Infinity);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    pixels[pixel * 4 + 3] = 255;
    idPixels[pixel * 4 + 3] = 255;
  }

  const minH = Math.min(...report.map((component) => component.min[view.horizontal]));
  const maxH = Math.max(...report.map((component) => component.max[view.horizontal]));
  const minV = Math.min(...report.map((component) => component.min[view.vertical]));
  const maxV = Math.max(...report.map((component) => component.max[view.vertical]));
  const scale = Math.min((width - 80) / (maxH - minH), (height - 80) / (maxV - minV));
  const offsetX = (width - (maxH - minH) * scale) / 2;
  const offsetY = (height - (maxV - minV) * scale) / 2;

  for (let vertex = 0; vertex < positions.accessor.count; vertex += 2) {
    if (vertexComponent[vertex] === 0xffffffff) continue;
    const point = positions.read(vertex);
    const x = Math.round(offsetX + (point[view.horizontal] - minH) * scale);
    const y = Math.round(height - offsetY - (point[view.vertical] - minV) * scale);
    const z = point[view.depth];
    const color = textureColor(vertex);
    const idColor = componentColor(vertexComponent[vertex]);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const index = py * width + px;
        if (z > depth[index]) continue;
        depth[index] = z;
        const offset = index * 4;
        pixels[offset] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
        pixels[offset + 3] = 255;
        idPixels[offset] = idColor[0];
        idPixels[offset + 1] = idColor[1];
        idPixels[offset + 2] = idColor[2];
        idPixels[offset + 3] = 255;
      }
    }
  }
  for (const component of report.filter((item) => item.vertexCount >= 500)) {
    const x = offsetX + (component.center[view.horizontal] - minH) * scale;
    const y = height - offsetY - (component.center[view.vertical] - minV) * scale;
    drawLabel(idPixels, x, y, String(component.id));
  }
  await writeFile(resolve(outputDir, `${view.name}.jpg`), jpeg.encode({ data: pixels, width, height }, 92).data);
  await writeFile(resolve(outputDir, `${view.name}-ids.jpg`), jpeg.encode({ data: idPixels, width, height }, 92).data);
}

console.log(`Rendered ${views.length} projections and ${report.length} component records`);
