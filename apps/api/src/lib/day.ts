/**
 * The day and the week the ledger counts in. Both are UTC: a device cap, a
 * settlement, and the pool card all read the same clock, whatever the venue's
 * own time is.
 */

export function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** The Monday at 00:00 UTC on or before `now`. */
export function startOfUtcWeek(now: Date): Date {
  const day = startOfUtcDay(now);
  // getUTCDay: Sunday is 0. Monday is 1. A Sunday goes back six days.
  const back = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - back);
  return day;
}
