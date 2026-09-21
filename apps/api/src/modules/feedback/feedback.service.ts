import type { CreateFeedbackInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { desc, eq } from "drizzle-orm";
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
 * The feedback desk: every row a member sent, newest first, with the member
 * beside it. An admin reads it; there is nothing to approve. The bound is the
 * same one the other desks use, so a long history never floods one page.
 */
export async function listFeedbackQueue() {
  const rows = await db
    .select({
      feedback: schema.feedback,
      owner: { name: schema.user.name, email: schema.user.email },
    })
    .from(schema.feedback)
    .innerJoin(schema.user, eq(schema.user.id, schema.feedback.userId))
    .orderBy(desc(schema.feedback.createdAt))
    .limit(100);

  return { items: rows };
}
