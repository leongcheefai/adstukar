import * as z from "zod/v4";
import { placementContract } from "../entities/placement";

// A placement always travels with its excluded terms; the dashboard edits both together.
export const placementWithTermsOutput = z.object({
  placement: placementContract,
  excludedTerms: z.array(z.string()),
});

export const listPlacementsOutput = z.array(placementWithTermsOutput);
export const deletePlacementOutput = z.object({ id: z.string() });

export type PlacementWithTerms = z.output<typeof placementWithTermsOutput>;
