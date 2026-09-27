import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";

/**
 * Whether a member may delete their own account from the dashboard.
 *
 * A delete is an archive once money has moved: the ledger is append-only, and a
 * play is the record an earn row points at. A member with neither never took
 * part in the economy, and deleting them leaves nothing behind that anything
 * else refers to. Anyone else closes through support, so an admin can settle
 * the balance first.
 */
export async function accountClosable(userId: string): Promise<boolean> {
  const [entry] = await db
    .select({ id: schema.ledgerEntry.id })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.userId, userId))
    .limit(1);
  if (entry) return false;

  // A play restricts its placement, so a screen that ever played blocks the
  // cascade from the member down to the placement. House plays post no ledger
  // row, so this is its own check.
  const [played] = await db
    .select({ id: schema.play.id })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.play.placementId, schema.placement.id))
    .innerJoin(schema.device, eq(schema.placement.deviceId, schema.device.id))
    .where(eq(schema.device.userId, userId))
    .limit(1);
  return played === undefined;
}

export const ACCOUNT_NOT_CLOSABLE =
  "This account has money or play history, so it cannot be deleted here. Contact support to close it.";
