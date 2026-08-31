import { getCollection } from "astro:content";
import { project } from "@repo/config/project";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute, GetStaticPaths } from "astro";
import { createElement } from "react";
import satori from "satori";
import { MARKETING_PAGES } from "../../lib/pages";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog");
  const blogPaths = posts
    .filter((p) => !p.data.draft)
    .map((post) => ({
      params: { slug: `blog-${post.id}` },
      props: { title: post.data.title, description: post.data.description },
    }));
  const staticPaths = MARKETING_PAGES.map((page) => ({
    params: { slug: page.slug },
    props: {
      title: page.ogTitle ?? page.title,
      description: page.ogDescription ?? page.description,
    },
  }));
  return [...staticPaths, ...blogPaths];
};

// Swap to fs.readFileSync('./public/fonts/Inter-Regular.woff') for offline builds
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function getFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (fontRegular && fontBold) return [fontRegular, fontBold];
  const base = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest";
  [fontRegular, fontBold] = await Promise.all([
    fetch(`${base}/latin-400-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${base}/latin-700-normal.woff`).then((r) => r.arrayBuffer()),
  ]);
  return [fontRegular, fontBold];
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as { title: string; description: string };
  const [regular, bold] = await getFonts();

  const svg = await satori(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          backgroundColor: "#0a0a0a",
          fontFamily: "Inter",
        },
      },
      createElement(
        "p",
        { style: { fontSize: "20px", color: "#6b7280", margin: "0 0 16px 0", fontWeight: 400 } },
        project.name,
      ),
      createElement(
        "h1",
        {
          style: {
            fontSize: title.length > 40 ? "44px" : "56px",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0",
            lineHeight: 1.1,
          },
        },
        title,
      ),
      description
        ? createElement(
            "p",
            {
              style: { fontSize: "22px", color: "#9ca3af", margin: "20px 0 0 0", fontWeight: 400 },
            },
            description,
          )
        : null,
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
