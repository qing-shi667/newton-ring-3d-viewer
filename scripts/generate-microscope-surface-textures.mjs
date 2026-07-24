import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import jpeg from "jpeg-js";
import { recolorBluePixelsToSilver } from "../src/texture-recolor.js";
import { readGlb } from "./glb-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const glb = await readGlb(resolve(
  root,
  "assets/models/source/travelling-microscope-textured.glb",
));
const outputDir = resolve(root, "assets/textures/microscope");
await mkdir(outputDir, { recursive: true });

for (const target of [
  { nodeName: "tripo_part_1", fileName: "tripo-part-1-silver.jpg" },
  { nodeName: "tripo_part_16", fileName: "tripo-part-16-silver.jpg" },
]) {
  const node = glb.json.nodes.find((item) => item.name === target.nodeName);
  if (!node || node.mesh === undefined) {
    throw new Error(`${target.nodeName} was not found`);
  }

  const primitive = glb.json.meshes[node.mesh].primitives[0];
  const material = glb.json.materials[primitive.material];
  const textureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
  const image = glb.json.images[glb.json.textures[textureIndex].source];
  const view = glb.json.bufferViews[image.bufferView];
  const start = view.byteOffset ?? 0;
  const decoded = jpeg.decode(
    glb.binary.subarray(start, start + view.byteLength),
    { useTArray: true, formatAsRGBA: true },
  );
  const pixels = recolorBluePixelsToSilver(decoded.data);
  const output = jpeg.encode({
    data: pixels,
    width: decoded.width,
    height: decoded.height,
  }, 95);
  await writeFile(resolve(outputDir, target.fileName), output.data);
}
