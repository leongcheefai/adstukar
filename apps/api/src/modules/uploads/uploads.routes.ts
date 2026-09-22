import { zValidator } from "@hono/zod-validator";
import {
  presignAvatarInput,
  presignAvatarOutput,
  presignDevicePhotoInput,
  presignDevicePhotoOutput,
  presignLogoInput,
  presignLogoOutput,
  presignVideoInput,
  presignVideoOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  presignAvatarUpload,
  presignDevicePhotoUpload,
  presignLogoUpload,
  presignVideoUpload,
} from "./uploads.service";

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

uploadsRouter.post(
  "/device-photo/presign",
  zValidator("json", presignDevicePhotoInput),
  async (c) => {
    const user = c.get("user");
    if (!user) throw new HTTPException(401, { message: "Unauthorized" });
    const result = await presignDevicePhotoUpload(user.id, c.req.valid("json"));
    return c.json(
      presignDevicePhotoOutput.parse(result satisfies z.input<typeof presignDevicePhotoOutput>),
    );
  },
);

uploadsRouter.post("/video/presign", zValidator("json", presignVideoInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await presignVideoUpload(user.id, c.req.valid("json"));
  return c.json(presignVideoOutput.parse(result satisfies z.input<typeof presignVideoOutput>));
});
