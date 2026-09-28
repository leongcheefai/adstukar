import * as z from "zod/v4";
import { httpsUrl } from "./campaigns";
import { presignAvatarInput } from "./uploads";

/**
 * A preset is a wallpaper, so it goes up as a picture, at the cap a member's
 * own picture takes (`@repo/config/media`): it plays on the same screens.
 */
export const presignPresetInput = presignAvatarInput;

export type PresignPresetInput = z.infer<typeof presignPresetInput>;

/**
 * The shape of a key the preset presign hands out. The API refuses any other,
 * so a preset can never point at a member's avatar or at another prefix. `mp4`
 * stays for the clips recorded before presets became wallpapers.
 */
export const PRESET_KEY = /^presets\/[^/]+\/[0-9a-f-]{36}\.(png|jpg|webp|mp4)$/;

const presetName = z.string().trim().min(1).max(120);
const collectionId = z.string().min(1).max(64);

/**
 * Records a file the admin has already PUT to storage, into one collection.
 * Only the key, a name and the collection travel: the API reads the size and
 * the type off the stored object.
 */
export const createPresetInput = z.object({
  key: z.string().regex(PRESET_KEY),
  name: presetName,
  collectionId,
});

export type CreatePresetInput = z.infer<typeof createPresetInput>;

/** Renames a preset, moves it to another collection, or both. */
export const updatePresetInput = z
  .object({
    name: presetName.optional(),
    collectionId: collectionId.optional(),
  })
  .refine((v) => v.name !== undefined || v.collectionId !== undefined, {
    message: "Nothing to change",
  });

export type UpdatePresetInput = z.infer<typeof updatePresetInput>;

/**
 * A wallpaper collection: its name, the page every one of its photos opens
 * (HTTPS, as a campaign's link is), and the photographer the set credits. An
 * edit sends the whole of it again.
 */
export const presetCollectionInput = z.object({
  name: z.string().trim().min(1).max(80),
  url: httpsUrl,
  author: z
    .string()
    .trim()
    .max(80)
    .nullish()
    .transform((v) => (v ? v : null)),
});

export type PresetCollectionInput = z.infer<typeof presetCollectionInput>;
