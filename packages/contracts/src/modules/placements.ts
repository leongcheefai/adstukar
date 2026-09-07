import * as z from "zod/v4";
import { placementContract } from "../entities/placement";

export const listPlacementsOutput = z.array(placementContract);
export const placementOutput = placementContract;
export const deletePlacementOutput = z.object({ id: z.string() });
