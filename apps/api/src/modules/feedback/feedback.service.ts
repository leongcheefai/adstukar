import type { CreateFeedbackInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { asc, desc, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { createFeedbackIssue } from "../../lib/github";
import { log } from "../../lib/logger";

export async function createFeedback(
  userId: string,
  userEmail: string,
  input: CreateFeedbackInput,
) {
  const id = crypto.randomUUID();
  await db.insert(schema.feedback).values({ id, userId, ...input });

  let issueUrl: string | undefined;
  try {
    const issue = await createFeedbackIssue({ id, userEmail, userId, ...input });
    issueUrl = issue?.html_url ?? undefined;
  } catch (err) {
    log("warn", "github_issue_create_failed", { feedbackId: id, err: String(err) });
  }

  return { id, issueUrl };
}

/**
 * The feedback desk: every row a member sent, with the member beside it. Open
 * rows come first, then newest first, so what still needs a read sits on top.
 * The bound is the same one the other desks use, so a long history never
 * floods one page.
 */
export async function listFeedbackQueue() {
  const rows = await db
    .select({
      feedback: schema.feedback,
      owner: { name: schema.user.name, email: schema.user.email },
    })
    .from(schema.feedback)
    .innerJoin(schema.user, eq(schema.user.id, schema.feedback.userId))
    .orderBy(asc(sql`${schema.feedback.resolvedAt} IS NOT NULL`), desc(schema.feedback.createdAt))
    .limit(100);

  return { items: rows };
}

/**
 * Stamps a row resolved, or clears the stamp. An admin's act, and a reversible
 * one: the desk has no confirm step, so a wrong press must be undone the same
 * way it was made.
 */
export async function setFeedbackResolved(
  feedbackId: string,
  adminId: string,
  resolved: boolean,
  now: Date = new Date(),
) {
  const [row] = await db
    .update(schema.feedback)
    .set(
      resolved ? { resolvedAt: now, resolvedBy: adminId } : { resolvedAt: null, resolvedBy: null },
    )
    .where(eq(schema.feedback.id, feedbackId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Feedback not found" });
  return row;
}
