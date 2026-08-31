import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const LIMIT_BYTES = 10 * 1024;
const file = resolve(import.meta.dirname, "../dist/adstukar.js");

let source;
try {
  source = readFileSync(file);
} catch {
  console.error(`check-size: ${file} not found. Run "vite build" first.`);
  process.exit(1);
}

const raw = source.byteLength;
const gzipped = gzipSync(source, { level: 9 }).byteLength;
const kb = (bytes) => (bytes / 1024).toFixed(2);

console.log(
  `adstukar.js: ${raw} B raw, ${gzipped} B gzipped (${kb(gzipped)} kB of ${kb(LIMIT_BYTES)} kB budget)`,
);

if (gzipped > LIMIT_BYTES) {
  console.error(
    `check-size: dist/adstukar.js gzips to ${gzipped} B, ${gzipped - LIMIT_BYTES} B over the ${LIMIT_BYTES} B budget. Remove the dependency or helper that grew it.`,
  );
  process.exit(1);
}
