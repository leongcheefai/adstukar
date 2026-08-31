import { zValidator } from "@hono/zod-validator";
import {
  createProductInput,
  deleteProductOutput,
  listProductsOutput,
  productOutput,
  updateProductInput,
  verifyProductOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  verifyProduct,
} from "./products.service";

export const productsRouter = new Hono<{ Variables: AppVariables }>();

productsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const rows = await listProducts(user.id);
  return c.json(listProductsOutput.parse(rows satisfies z.input<typeof listProductsOutput>));
});

productsRouter.post("/", zValidator("json", createProductInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await createProduct(user.id, c.req.valid("json"));
  return c.json(productOutput.parse(row satisfies z.input<typeof productOutput>), 201);
});

productsRouter.patch("/:id", zValidator("json", updateProductInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await updateProduct(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(productOutput.parse(row satisfies z.input<typeof productOutput>));
});

productsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await deleteProduct(user.id, c.req.param("id"));
  return c.json(deleteProductOutput.parse(result satisfies z.input<typeof deleteProductOutput>));
});

productsRouter.post("/:id/verify", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await verifyProduct(user.id, c.req.param("id"));
  return c.json(verifyProductOutput.parse(result satisfies z.input<typeof verifyProductOutput>));
});
