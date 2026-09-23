import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

/**
 * The favicon, drawn as a square PNG. The Organization schema wants a raster
 * logo, and iOS wants a raster home-screen icon; both come from the one SVG
 * in `public/`, so they cannot drift from it. Build time only.
 */
export async function iconPng(size: number): Promise<Response> {
  const svg = await readFile(join(process.cwd(), "public/favicon.svg"), "utf8");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
