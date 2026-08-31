import { zValidator } from "@hono/zod-validator";
import {
  presignAvatarInput,
  presignAvatarOutput,
  presignLogoInput,
  presignLogoOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { presignAvatarUpload, presignLogoUpload } from "./uploads.service";

export const uploadsRouter = new Hono<{ Variables: AppVariables }>();

uploadsRouter.post("/avatar/presign", zValidator("json", presignAvatarInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await presignAvatarUpload(user.id, input);
  return c.json(presignAvatarOutput.parse(result satisfies z.input<typeof presignAvatarOutput>));
});

uploadsRouter.post("/logo/presign", zValidator("json", presignLogoInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await presignLogoUpload(user.id, input);
  return c.json(presignLogoOutput.parse(result satisfies z.input<typeof presignLogoOutput>));
});
