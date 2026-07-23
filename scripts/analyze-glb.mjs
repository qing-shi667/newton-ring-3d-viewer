import { resolve } from "node:path";
import { findConnectedComponents, readGlb } from "./glb-utils.mjs";

const input = resolve(process.argv[2] ?? "assets/models/source/newton-ring-source.glb");
const glb = await readGlb(input);
const components = findConnectedComponents(glb).map(({ vertices, root, ...component }) => component);
console.log(JSON.stringify({ input, componentCount: components.length, components }, null, 2));

