function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function recolorBluePixelsToSilver(source) {
  const output = Uint8Array.from(source);

  for (let offset = 0; offset + 3 < output.length; offset += 4) {
    const red = output[offset];
    const green = output[offset + 1];
    const blue = output[offset + 2];
    const isBlue = blue >= 60 && blue - red >= 20 && blue - green >= 8;
    if (!isBlue) continue;

    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const silver = clampByte(76 + luminance * 0.75);
    output[offset] = silver;
    output[offset + 1] = clampByte(silver + 1);
    output[offset + 2] = clampByte(silver + 2);
  }

  return output;
}
