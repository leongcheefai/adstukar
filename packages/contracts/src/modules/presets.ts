import * as z from "zod/v4";
import { presetMediaContract } from "../entities/preset-media";
import { presignAvatarOutput } from "./uploads";

/** Every preset, oldest first: the order a member's library shows them in. */
export const presetListOutput = z.object({
  items: z.array(presetMediaContract),
});

export const presignPresetOutput = presignAvatarOutput;
export const createPresetOutput = presetMediaContract;
export const updatePresetOutput = presetMediaContract;
export const deletePresetOutput = z.object({ id: z.string() });

export type PresetList = z.output<typeof presetListOutput>;
export type PresignPresetResponse = z.output<typeof presignPresetOutput>;
export type DeletePresetResponse = z.output<typeof deletePresetOutput>;
