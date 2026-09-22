import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default("TODO: Author Name"),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/* One file is one help topic, and one page. `.mdx` where the text quotes a
   number, so the number is imported from `@repo/config/economy` and never
   typed by hand. */
const help = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/help" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Position in the side menu, lowest first. */
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, help };
