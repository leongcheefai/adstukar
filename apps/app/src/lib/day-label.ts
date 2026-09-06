const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-09-04" to "Sep 4".
 *
 * It reads the parts of the string. `new Date("2026-09-04")` parses as UTC
 * midnight, so a reader west of Greenwich would see every label one day early.
 */
export function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  const index = Number(month) - 1;
  if (!MONTHS[index] || !date) return day;
  return `${MONTHS[index]} ${Number(date)}`;
}
