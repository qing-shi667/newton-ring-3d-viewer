import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { findConnectedComponents, readGlb } from "./glb-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const glb = await readGlb(resolve(root, "assets/models/source/newton-ring-source.glb"));
const primitive = glb.json.meshes[0].primitives[0];
const components = findConnectedComponents(glb, primitive);
const vertexComponent = new Uint16Array(glb.json.accessors[primitive.attributes.POSITION].count);
for (const component of components) {
  for (const vertex of component.vertices) vertexComponent[vertex] = component.id;
}

const accessor = glb.json.accessors[primitive.indices];
const view = glb.json.bufferViews[accessor.bufferView];
const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
const stride = view.byteStride ?? (accessor.componentType === 5125 ? 4 : 2);
const readIndex = accessor.componentType === 5125
  ? (index) => glb.binary.readUInt32LE(start + index * stride)
  : (index) => glb.binary.readUInt16LE(start + index * stride);
const faceComponents = [];
for (let index = 0; index < accessor.count; index += 3) {
  faceComponents.push(vertexComponent[readIndex(index)]);
}

await mkdir(resolve(root, "tmp"), { recursive: true });
await writeFile(resolve(root, "tmp/component-map.json"), JSON.stringify({ faceComponents }));
console.log(`Wrote ${faceComponents.length} face component IDs`);

