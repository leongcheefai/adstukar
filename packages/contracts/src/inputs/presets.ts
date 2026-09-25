import * as z from "zod/v4";
import { presignAvatarInput, presignVideoInput } from "./uploads";

/**
 * A preset goes up as a picture or as a clip, at the caps a member's own file
 * takes (`@repo/config/media`): a preset plays on the same screens.
 */
export const presignPresetInput = z.union([presignAvatarInput, presignVideoInput]);

export type PresignPresetInput = z.infer<typeof presignPresetInput>;

/**
 * The shape of a key the preset presign hands out. The API refuses any other,
 * so a preset can never point at a member's avatar or at another prefix.
 */
export const PRESET_KEY = /^presets\/[^/]+\/[0-9a-f-]{36}\.(png|jpg|webp|mp4)$/;

const presetName = z.string().trim().min(1).max(120);

/**
 * Records a file the admin has already PUT to storage. Only the key and a name
 * travel: the API reads the size and the type off the stored object.
 */
export const createPresetInput = z.object({
  key: z.string().regex(PRESET_KEY),
  name: presetName,
});

export type CreatePresetInput = z.infer<typeof createPresetInput>;

export const updatePresetInput = z.object({
  name: presetName,
});

export type UpdatePresetInput = z.infer<typeof updatePresetInput>;
