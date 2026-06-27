const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function generateNoisePNG(width, height, filename) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeInt32BE(width, 0);
  ihdrData.writeInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 0; // color type (0 = grayscale)
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method

  const ihdr = createChunk('IHDR', ihdrData);

  // Generate noise pixels
  // Each scanline in PNG must start with a filter byte (0 for none)
  const scanlineLength = width + 1;
  const pixelData = Buffer.alloc(height * scanlineLength);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    pixelData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const noise = Math.floor(Math.random() * 256);
      pixelData[rowOffset + 1 + x] = noise;
    }
  }

  // IDAT chunk (zlib compressed pixel data)
  const compressed = zlib.deflateSync(pixelData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  // Combine and write to file
  const png = Buffer.concat([signature, ihdr, idat, iend]);
  
  // Ensure directory exists
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, png);
  console.log(`Noise PNG generated successfully at ${filename}`);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  // CRC-32 calculation
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC-32 table-based calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

generateNoisePNG(128, 128, process.argv[2]);
