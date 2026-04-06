const CRC32_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

export interface Crc32Accumulator {
  digest(): number;
  update(buffer: Buffer): void;
}

export function createCrc32Accumulator(): Crc32Accumulator {
  let crc = 0xffffffff;

  return {
    update(buffer: Buffer) {
      for (const byte of buffer) {
        crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      }
    },
    digest() {
      return (crc ^ 0xffffffff) >>> 0;
    },
  };
}

export function crc32(buffer: Buffer): number {
  const accumulator = createCrc32Accumulator();
  accumulator.update(buffer);
  return accumulator.digest();
}
