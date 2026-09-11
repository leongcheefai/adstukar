import * as z from "zod/v4";

export const presignAvatarInput = z.object({
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  size: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024), // 5 MB
});

export type PresignAvatarInput = z.infer<typeof presignAvatarInput>;

export const presignLogoInput = presignAvatarInput;
export type PresignLogoInput = z.infer<typeof presignLogoInput>;

/**
 * A photo of the screen in place. It shares the avatar rules, because an admin
 * reviewing a device wants the same kind of file at the same size.
 */
export const presignDevicePhotoInput = presignAvatarInput;
export type PresignDevicePhotoInput = z.infer<typeof presignDevicePhotoInput>;
