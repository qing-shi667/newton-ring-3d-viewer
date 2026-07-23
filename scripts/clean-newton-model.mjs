import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readGlb, writeFilteredGlb } from "./glb-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/models/source/newton-ring-source.glb");
const output = resolve(root, "assets/models/newton-ring-clean.glb");
const config = JSON.parse(await readFile(resolve(import.meta.dirname, "model-cleaning-config.json"), "utf8"));
const sourceBytes = await readFile(source);
const hash = createHash("sha256").update(sourceBytes).digest("hex");
if (hash !== config.sourceSha256) {
  throw new Error(`Source model hash changed: ${hash}`);
}

const glb = await readGlb(source);
const result = await writeFilteredGlb(glb, output, new Set(config.removeComponentIds));
console.log(JSON.stringify({
  output,
  removed: config.removeComponentIds,
  sourceIndexCount: result.sourceIndexCount,
  keptIndexCount: result.keptIndexCount,
  componentCount: result.components.length,
}, null, 2));
