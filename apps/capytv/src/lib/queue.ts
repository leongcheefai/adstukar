/**
 * The report queue. A screen in a café keeps its network only as long as the café
 * does, so a play that cannot be reported now is kept and sent when the network
 * returns. Everything here is pure, so the rules are testable without a browser.
 */

export interface QueuedReport {
  playId: string;
  /** When the play actually ran. The server counts it against that day. */
  playedAt: string;
  /** When the server stops accepting it. Absent on a report from a live serve. */
  expiresAt?: string;
}

/**
 * Adds a report, once. A screen that reloads mid-play may report the same play
 * twice; the server is idempotent, but sending it twice would still eat a slot in
 * a queue that is holding a whole evening of plays.
 */
export function enqueue(queue: QueuedReport[], report: QueuedReport): QueuedReport[] {
  if (queue.some((r) => r.playId === report.playId)) return queue;
  return [...queue, report];
}

/** Drops the reports the server has taken. */
export function forget(queue: QueuedReport[], playIds: string[]): QueuedReport[] {
  const sent = new Set(playIds);
  return queue.filter((r) => !sent.has(r.playId));
}

/**
 * Caps the queue. A screen offline for days would otherwise fill its storage with
 * reports the server will refuse anyway, so the oldest go first.
 */
export function trim(queue: QueuedReport[], max: number): QueuedReport[] {
  if (queue.length <= max) return queue;
  return queue.slice(queue.length - max);
}

/**
 * The reports worth sending. One whose play has expired earns nothing, so it goes
 * rather than spending a request to be refused.
 */
export function drainable(queue: QueuedReport[], now: Date): QueuedReport[] {
  return queue.filter((r) => !r.expiresAt || new Date(r.expiresAt) > now);
}
