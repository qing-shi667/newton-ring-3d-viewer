import assert from "node:assert/strict";
import test from "node:test";

const module = await import("../src/texture-recolor.js").catch(() => ({}));

test("blue pixels become luminance-preserving neutral silver", () => {
  assert.equal(typeof module.recolorBluePixelsToSilver, "function");
  const source = Uint8Array.from([48, 88, 142, 255]);
  const output = module.recolorBluePixelsToSilver(source);

  assert.notDeepEqual([...output], [...source]);
  assert.ok(Math.abs(output[0] - output[1]) <= 3);
  assert.ok(Math.abs(output[1] - output[2]) <= 3);
  assert.ok(output[0] > source[0]);
  assert.equal(output[3], 255);
});

test("non-blue pixels remain byte-identical", () => {
  const source = Uint8Array.from([
    120, 122, 121, 255,
    18, 20, 22, 255,
    150, 110, 70, 255,
  ]);

  assert.deepEqual([...module.recolorBluePixelsToSilver(source)], [...source]);
});
