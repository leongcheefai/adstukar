export const SERIES_DAYS = 30;

export interface DayCounts {
  played: number;
  received: number;
  scans: number;
  earned: number;
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function emptyDay(): DayCounts {
  return { played: 0, received: 0, scans: 0, earned: 0 };
}

/** Empty 30-day scaffold ending today (UTC), oldest first. */
export function emptySeries(now: Date): Map<string, DayCounts> {
  const series = new Map<string, DayCounts>();
  const today = utcDayStart(now);
  for (let i = SERIES_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86_400_000);
    series.set(dayKey(d), emptyDay());
  }
  return series;
}
