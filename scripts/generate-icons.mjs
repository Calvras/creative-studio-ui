// Generates the opaque home-screen / PWA icon set from the existing EDIT+ mark.
// iOS rejects apple-touch-icons that contain an alpha channel, so every file
// produced here is 8-bit RGB (no transparency).
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const OUT = new URL("../public/", import.meta.url);
const SRC = readFileSync(new URL("./source-icon.png", import.meta.url));

function decodePng(buf) {
  let pos = 8;
  let width = 0,
    height = 0,
    colorType = 0,
    bitDepth = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG not supported");
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || colorType !== 6) throw new Error("expected 8-bit RGBA source");
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const px = Buffer.alloc(width * height * bpp);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    for (let x = 0; x < stride; x++) {
      const cur = raw[p++];
      const left = x >= bpp ? px[y * stride + x - bpp] : 0;
      const up = y > 0 ? px[(y - 1) * stride + x] : 0;
      const upLeft = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let val;
      switch (filter) {
        case 0:
          val = cur;
          break;
        case 1:
          val = cur + left;
          break;
        case 2:
          val = cur + up;
          break;
        case 3:
          val = cur + ((left + up) >> 1);
          break;
        case 4: {
          const pa = Math.abs(up - upLeft),
            pb = Math.abs(left - upLeft),
            pc = Math.abs(left + up - 2 * upLeft);
          val = cur + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default:
          throw new Error("bad filter " + filter);
      }
      px[y * stride + x] = val & 0xff;
    }
  }
  return { width, height, data: px };
}

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour, no alpha
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const src = decodePng(SRC);

// The source artwork is the white EDIT+ mark on black, so luminance is the
// mask. (The file carries an alpha channel, but it is opaque everywhere.)
const lum = (x, y) => {
  const i = (y * src.width + x) * 4;
  return (0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2]) / 255;
};

let minX = src.width,
  minY = src.height,
  maxX = 0,
  maxY = 0;
for (let y = 0; y < src.height; y++) {
  for (let x = 0; x < src.width; x++) {
    if (lum(x, y) > 0.12) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}
const markW = maxX - minX + 1;
const markH = maxY - minY + 1;
console.log(`source ${src.width}x${src.height}, mark ${markW}x${markH} at ${minX},${minY}`);

// Bilinear sample of the mark mask at an arbitrary source position.
function alphaAt(sx, sy) {
  const x0 = Math.max(0, Math.min(src.width - 1, Math.floor(sx)));
  const y0 = Math.max(0, Math.min(src.height - 1, Math.floor(sy)));
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const fx = sx - x0,
    fy = sy - y0;
  const a = (x, y) => Math.pow(Math.min(1, lum(x, y) / 0.92), 1.08);
  const top = a(x0, y0) * (1 - fx) + a(x1, y0) * fx;
  const bot = a(x0, y1) * (1 - fx) + a(x1, y1) * fx;
  return Math.max(0, Math.min(1, top * (1 - fy) + bot * fy));
}

// Opaque editorial-dark backdrop with a warm brand glow behind the mark.
function makeMaster(size, markScale) {
  const rgb = Buffer.alloc(size * size * 3);
  const markSize = Math.round(size * markScale);
  const scale = markSize / Math.max(markW, markH);
  const dx = (size - markW * scale) / 2;
  const dy = (size - markH * scale) / 2;
  const cx = size * 0.5,
    cy = size * 0.47;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      // base vertical graphite gradient
      let r = 12 + v * 8;
      let g = 12 + v * 7;
      let b = 14 + v * 8;
      // warm halo
      const d = Math.hypot((x - cx) / size, (y - cy) / size);
      const halo = Math.max(0, 1 - d / 0.52);
      const glow = halo * halo * 0.55;
      r += glow * 190;
      g += glow * 82;
      b += glow * 26;
      // subtle vignette
      const edge = Math.hypot(u - 0.5, v - 0.5);
      const vig = Math.max(0, (edge - 0.34) / 0.42) * 26;
      r = Math.max(0, r - vig);
      g = Math.max(0, g - vig);
      b = Math.max(0, b - vig);

      let sx = (x - dx) / scale + minX;
      let sy = (y - dy) / scale + minY;
      let a = 0;
      if (sx >= minX - 1 && sy >= minY - 1 && sx <= maxX + 1 && sy <= maxY + 1) {
        a = alphaAt(sx, sy);
      }
      // white mark over the backdrop
      r = r * (1 - a) + 255 * a;
      g = g * (1 - a) + 255 * a;
      b = b * (1 - a) + 255 * a;

      const i = (y * size + x) * 3;
      rgb[i] = Math.round(r);
      rgb[i + 1] = Math.round(g);
      rgb[i + 2] = Math.round(b);
    }
  }
  return rgb;
}

function downscale(width, height, srcRgb, size) {
  const out = Buffer.alloc(size * size * 3);
  const sx = width / size,
    sy = height / size;
  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * sy),
      y1 = Math.min(height, Math.ceil((y + 1) * sy));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * sx),
        x1 = Math.min(width, Math.ceil((x + 1) * sx));
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * width + xx) * 3;
          r += srcRgb[i];
          g += srcRgb[i + 1];
          b += srcRgb[i + 2];
          n++;
        }
      }
      const i = (y * size + x) * 3;
      out[i] = r / n;
      out[i + 1] = g / n;
      out[i + 2] = b / n;
    }
  }
  return out;
}

const MASTER = 1024;
const master = makeMaster(MASTER, 0.6);
writeFileSync(new URL("icon-1024.png", OUT), encodePng(MASTER, MASTER, master));
console.log("wrote icon-1024.png");

const sizes = {
  "icon-512.png": 512,
  "icon-192.png": 192,
  "apple-touch-icon.png": 180,
  "apple-touch-icon-180x180.png": 180,
  "apple-touch-icon-167x167.png": 167,
  "apple-touch-icon-152x152.png": 152,
  "apple-touch-icon-120x120.png": 120,
  "favicon-32.png": 32,
};
for (const [name, size] of Object.entries(sizes)) {
  const rgb = size === MASTER ? master : downscale(MASTER, MASTER, master, size);
  writeFileSync(new URL(name, OUT), encodePng(size, size, rgb));
  console.log("wrote", name);
}

// Maskable variant keeps the mark inside the 80% safe circle.
const maskMaster = makeMaster(512, 0.44);
writeFileSync(new URL("icon-maskable-512.png", OUT), encodePng(512, 512, maskMaster));
console.log("wrote icon-maskable-512.png");

// Opaque favicon.ico (single 256x256 PNG entry is accepted by browsers).
const icoPng = encodePng(256, 256, downscale(MASTER, MASTER, master, 256));
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 0;
header[7] = 0;
header[8] = 0;
header[9] = 0;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(icoPng.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync(new URL("favicon.ico", OUT), Buffer.concat([header, icoPng]));
console.log("wrote favicon.ico");
