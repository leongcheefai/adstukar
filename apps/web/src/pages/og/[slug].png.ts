import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { getCollection } from "astro:content";
import { project } from "@repo/config/project";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute, GetStaticPaths } from "astro";
import { createElement } from "react";
import satori from "satori";
import { MARKETING_PAGES } from "../../lib/pages";
import { THEME_COLOR } from "../../lib/seo/brand";

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
  const helpPaths = (await getCollection("help"))
    .filter((a) => !a.data.draft)
    .map((article) => ({
      params: { slug: `help-${article.id}` },
      props: { title: article.data.title, description: article.data.description },
    }));
  return [...staticPaths, ...blogPaths, ...helpPaths];
};

// Poppins is already vendored in @repo/ui for the site itself, so the OG card
// uses the same faces from disk. A network fetch here made every offline build
// fail, and it let the card drift to a different typeface than the pages it
// represents.
const resolveFont = (file: string) =>
  createRequire(import.meta.url).resolve(`@repo/ui/assets/fonts/${file}`);

let fontRegular: Buffer | null = null;
let fontBold: Buffer | null = null;

async function getFonts(): Promise<[Buffer, Buffer]> {
  if (!fontRegular || !fontBold) {
    [fontRegular, fontBold] = await Promise.all([
      readFile(resolveFont("Poppins-Regular.ttf")),
      readFile(resolveFont("Poppins-Bold.ttf")),
    ]);
  }
  return [fontRegular, fontBold];
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as { title: string; description: string };
  const [regular, bold] = await getFonts();
  // The card already carries the brand as its own line, so drop the product
  // name that `pageTitle()` puts after a page, and the home puts before it.
  const headline = title.startsWith(`${project.name} | `)
    ? title.slice(project.name.length + 3)
    : title.endsWith(` | ${project.name}`)
      ? title.slice(0, -(project.name.length + 3))
      : title;

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
          padding: "72px",
          backgroundColor: THEME_COLOR,
          fontFamily: "Poppins",
        },
      },
      createElement(
        "p",
        {
          style: {
            fontSize: "22px",
            color: "#CBDAF9",
            margin: "0 0 20px 0",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          },
        },
        project.name,
      ),
      createElement(
        "h1",
        {
          style: {
            fontSize: headline.length > 40 ? "48px" : "60px",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          },
        },
        headline,
      ),
      description
        ? createElement(
            "p",
            {
              style: { fontSize: "22px", color: "#CBDAF9", margin: "22px 0 0 0", fontWeight: 400 },
            },
            description,
          )
        : null,
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Poppins", data: regular, weight: 400, style: "normal" },
        { name: "Poppins", data: bold, weight: 700, style: "normal" },
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
