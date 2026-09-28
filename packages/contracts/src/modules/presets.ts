import * as z from "zod/v4";
import { presetCollectionContract } from "../entities/preset-collection";
import { presetMediaContract } from "../entities/preset-media";
import { presignAvatarOutput } from "./uploads";

/**
 * Every collection and every preset, oldest first: the order the wallpaper
 * chooser and the desk show them in. A preset names its collection; one with
 * none predates collections and only the desk shows it.
 */
export const presetListOutput = z.object({
  collections: z.array(presetCollectionContract),
  items: z.array(presetMediaContract),
});

export const presignPresetOutput = presignAvatarOutput;
export const createPresetOutput = presetMediaContract;
export const updatePresetOutput = presetMediaContract;
export const deletePresetOutput = z.object({ id: z.string() });

export const createPresetCollectionOutput = presetCollectionContract;
export const updatePresetCollectionOutput = presetCollectionContract;
export const deletePresetCollectionOutput = z.object({ id: z.string() });

export type PresetList = z.output<typeof presetListOutput>;
export type PresignPresetResponse = z.output<typeof presignPresetOutput>;
export type DeletePresetResponse = z.output<typeof deletePresetOutput>;
export type DeletePresetCollectionResponse = z.output<typeof deletePresetCollectionOutput>;
