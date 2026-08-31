import * as z from "zod/v4";

export const presignAvatarOutput = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  key: z.string(),
});

export type PresignAvatarResponse = z.output<typeof presignAvatarOutput>;
