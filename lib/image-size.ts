/** Minimal PNG/JPEG o'lcham (px) aniqlagich — tashqi kutubxonasiz. */
export function getImageSize(
  buffer: Buffer
): { width: number; height: number } | null {
  // PNG: signature 89 50 4E 47
  if (
    buffer.length > 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // JPEG: FF D8
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF markerlar (C0..CF), lekin C4/C8/CC emas
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  return null;
}
