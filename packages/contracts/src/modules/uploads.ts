import * as z from "zod/v4";

export const presignAvatarOutput = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  key: z.string(),
});

export type PresignAvatarResponse = z.output<typeof presignAvatarOutput>;

export const presignLogoOutput = presignAvatarOutput;
export type PresignLogoResponse = z.output<typeof presignLogoOutput>;

export const presignDevicePhotoOutput = presignAvatarOutput;
export type PresignDevicePhotoResponse = z.output<typeof presignDevicePhotoOutput>;
