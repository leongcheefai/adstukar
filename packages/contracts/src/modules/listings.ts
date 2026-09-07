import * as z from "zod/v4";
import { listingContract } from "../entities/listing";

export const listListingsOutput = z.array(listingContract);
export const listingOutput = listingContract;
export const archiveListingOutput = z.object({ id: z.string() });
