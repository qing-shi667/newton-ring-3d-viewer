import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    }, (error) => {
      this.onerror?.(error);
    });
  }
}

globalThis.FileReader = NodeFileReader;

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "assets/models/source/travelling-microscope-source.glb");
const outputPath = resolve(root, "assets/models/source/stage-clip-source.glb");
const source = await readFile(sourcePath);
const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const gltf = await new Promise((resolveLoad, rejectLoad) => {
  new GLTFLoader().parse(buffer, "", resolveLoad, rejectLoad);
});
const sourceClip = gltf.scene.getObjectByName("tripo_part_28");

if (!sourceClip) {
  throw new Error("tripo_part_28 was not found");
}

const clip = sourceClip.clone(false);
clip.name = "stage-clip-left";
clip.material = new THREE.MeshStandardMaterial({
  name: "stage-clip-black",
  color: 0x121517,
  metalness: 0.08,
  roughness: 0.42,
});

const output = await new GLTFExporter().parseAsync(clip, { binary: true });
await writeFile(outputPath, Buffer.from(output));
