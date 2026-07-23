import { readFile, writeFile } from "node:fs/promises";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const COMPONENT_BYTES = {
  5121: 1,
  5123: 2,
  5125: 4,
  5126: 4,
};

const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
};

export async function readGlb(pathOrUrl) {
  const buffer = await readFile(pathOrUrl);
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error("Not a GLB file");
  }
  if (buffer.readUInt32LE(4) !== 2) {
    throw new Error("Only GLB version 2 is supported");
  }

  let offset = 12;
  let json;
  let binary;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === JSON_CHUNK) {
      json = JSON.parse(data.toString("utf8").trim());
    } else if (type === BIN_CHUNK) {
      binary = Buffer.from(data);
    }
    offset += 8 + length;
  }

  if (!json || !binary) {
    throw new Error("GLB must contain JSON and BIN chunks");
  }
  return { json, binary };
}

function accessorReader(glb, accessorIndex) {
  const accessor = glb.json.accessors[accessorIndex];
  const view = glb.json.bufferViews[accessor.bufferView];
  const componentBytes = COMPONENT_BYTES[accessor.componentType];
  const componentCount = TYPE_COMPONENTS[accessor.type];
  if (!componentBytes || !componentCount) {
    throw new Error(`Unsupported accessor ${accessorIndex}`);
  }
  const stride = view.byteStride ?? componentBytes * componentCount;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

  function component(offset) {
    if (accessor.componentType === 5121) return glb.binary.readUInt8(offset);
    if (accessor.componentType === 5123) return glb.binary.readUInt16LE(offset);
    if (accessor.componentType === 5125) return glb.binary.readUInt32LE(offset);
    if (accessor.componentType === 5126) return glb.binary.readFloatLE(offset);
    throw new Error(`Unsupported component type ${accessor.componentType}`);
  }

  return {
    accessor,
    read(index) {
      const values = [];
      const base = start + index * stride;
      for (let i = 0; i < componentCount; i += 1) {
        values.push(component(base + i * componentBytes));
      }
      return componentCount === 1 ? values[0] : values;
    },
  };
}

export function readAccessor(glb, accessorIndex) {
  return accessorReader(glb, accessorIndex);
}

export function findConnectedComponents(glb, primitive = glb.json.meshes[0].primitives[0]) {
  const position = accessorReader(glb, primitive.attributes.POSITION);
  const indices = accessorReader(glb, primitive.indices);
  const vertexCount = position.accessor.count;
  const parent = new Int32Array(vertexCount);
  const rank = new Uint8Array(vertexCount);
  for (let i = 0; i < vertexCount; i += 1) parent[i] = i;

  function root(value) {
    let current = value;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  }

  function join(left, right) {
    let a = root(left);
    let b = root(right);
    if (a === b) return;
    if (rank[a] < rank[b]) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a] += 1;
  }

  for (let i = 0; i < indices.accessor.count; i += 3) {
    const a = indices.read(i);
    const b = indices.read(i + 1);
    const c = indices.read(i + 2);
    join(a, b);
    join(a, c);
  }

  const byRoot = new Map();
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const componentRoot = root(vertex);
    let component = byRoot.get(componentRoot);
    if (!component) {
      component = {
        root: componentRoot,
        vertices: [],
        triangleCount: 0,
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity],
      };
      byRoot.set(componentRoot, component);
    }
    component.vertices.push(vertex);
    const point = position.read(vertex);
    for (let axis = 0; axis < 3; axis += 1) {
      component.min[axis] = Math.min(component.min[axis], point[axis]);
      component.max[axis] = Math.max(component.max[axis], point[axis]);
    }
  }

  for (let i = 0; i < indices.accessor.count; i += 3) {
    const component = byRoot.get(root(indices.read(i)));
    component.triangleCount += 1;
  }

  return [...byRoot.values()]
    .filter((component) => component.triangleCount > 0)
    .sort((left, right) => right.vertices.length - left.vertices.length)
    .map((component, id) => ({
      id,
      root: component.root,
      vertexCount: component.vertices.length,
      triangleCount: component.triangleCount,
      min: component.min,
      max: component.max,
      center: component.min.map((value, axis) => (value + component.max[axis]) / 2),
      size: component.min.map((value, axis) => component.max[axis] - value),
      vertices: component.vertices,
    }));
}

function align4(value) {
  return (value + 3) & ~3;
}

export async function writeFilteredGlb(glb, outputPath, removedIds, primitive = glb.json.meshes[0].primitives[0]) {
  const components = findConnectedComponents(glb, primitive);
  const removedRoots = new Set(
    components.filter((component) => removedIds.has(component.id)).map((component) => component.root),
  );
  const vertexRoot = new Int32Array(glb.json.accessors[primitive.attributes.POSITION].count);
  for (const component of components) {
    for (const vertex of component.vertices) vertexRoot[vertex] = component.root;
  }

  const sourceIndices = accessorReader(glb, primitive.indices);
  const kept = [];
  for (let i = 0; i < sourceIndices.accessor.count; i += 3) {
    const a = sourceIndices.read(i);
    if (removedRoots.has(vertexRoot[a])) continue;
    kept.push(a, sourceIndices.read(i + 1), sourceIndices.read(i + 2));
  }

  const maxIndex = kept.reduce((max, value) => Math.max(max, value), 0);
  const componentType = maxIndex > 65535 ? 5125 : 5123;
  const bytesPerIndex = COMPONENT_BYTES[componentType];
  const indexBuffer = Buffer.alloc(kept.length * bytesPerIndex);
  kept.forEach((value, index) => {
    if (componentType === 5125) indexBuffer.writeUInt32LE(value, index * 4);
    else indexBuffer.writeUInt16LE(value, index * 2);
  });

  const json = structuredClone(glb.json);
  const binStart = align4(glb.binary.length);
  const binary = Buffer.alloc(align4(binStart + indexBuffer.length));
  glb.binary.copy(binary, 0);
  indexBuffer.copy(binary, binStart);

  const bufferViewIndex = json.bufferViews.length;
  json.bufferViews.push({ buffer: 0, byteOffset: binStart, byteLength: indexBuffer.length });
  const accessorIndex = json.accessors.length;
  json.accessors.push({
    bufferView: bufferViewIndex,
    componentType,
    count: kept.length,
    type: "SCALAR",
    min: [kept.reduce((min, value) => Math.min(min, value), maxIndex)],
    max: [maxIndex],
  });
  json.meshes[0].primitives[0].indices = accessorIndex;
  json.buffers[0].byteLength = binary.length;

  let jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
  jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(align4(jsonBuffer.length) - jsonBuffer.length, 0x20)]);
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binary.length;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(GLB_MAGIC, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(jsonBuffer.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  jsonBuffer.copy(output, 20);
  const binHeader = 20 + jsonBuffer.length;
  output.writeUInt32LE(binary.length, binHeader);
  output.writeUInt32LE(BIN_CHUNK, binHeader + 4);
  binary.copy(output, binHeader + 8);
  await writeFile(outputPath, output);
  return { sourceIndexCount: sourceIndices.accessor.count, keptIndexCount: kept.length, components };
}
