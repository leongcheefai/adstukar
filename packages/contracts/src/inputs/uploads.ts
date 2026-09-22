import { media } from "@repo/config/media";
import * as z from "zod/v4";

/** The caps live in `@repo/config/media`; the picker and the API read the same ones. */
export const presignAvatarInput = z.object({
  contentType: z.enum(media.image.types),
  size: z.number().int().positive().max(media.image.maxBytes),
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

/** A clip a screen plays. MP4 only, and no longer than a slot's dwell needs. */
export const presignVideoInput = z.object({
  contentType: z.enum(media.video.types),
  size: z.number().int().positive().max(media.video.maxBytes),
});

export type PresignVideoInput = z.infer<typeof presignVideoInput>;
