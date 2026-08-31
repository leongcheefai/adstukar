import * as z from "zod/v4";
import { releaseContract } from "../entities/release";

export const listReleasesOutput = z.array(releaseContract);
export const syncReleasesOutput = z.object({ synced: z.number().int() });

export type SyncReleasesResponse = z.output<typeof syncReleasesOutput>;
