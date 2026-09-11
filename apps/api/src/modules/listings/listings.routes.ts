import { zValidator } from "@hono/zod-validator";
import {
  archiveListingOutput,
  createListingInput,
  listListingsOutput,
  listListingsQuery,
  listingOutput,
  updateListingInput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { archiveListing, createListing, listListings, updateListing } from "./listings.service";

export const listingsRouter = new Hono<{ Variables: AppVariables }>();

listingsRouter.get("/", zValidator("query", listListingsQuery), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const rows = await listListings(user.id, c.req.valid("query").campaignId);
  return c.json(listListingsOutput.parse(rows satisfies z.input<typeof listListingsOutput>));
});

listingsRouter.post("/", zValidator("json", createListingInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await createListing(user.id, c.req.valid("json"));
  return c.json(listingOutput.parse(row satisfies z.input<typeof listingOutput>), 201);
});

listingsRouter.patch("/:id", zValidator("json", updateListingInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await updateListing(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(listingOutput.parse(row satisfies z.input<typeof listingOutput>));
});

listingsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await archiveListing(user.id, c.req.param("id"));
  return c.json(archiveListingOutput.parse(result satisfies z.input<typeof archiveListingOutput>));
});
