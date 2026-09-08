import type { Device } from "@repo/contracts/types";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";

/**
 * The hours the venue states it is open. The payout review counts the plays that
 * fall outside them, so a screen running all night in a room that shuts at six
 * is visible before cash leaves (docs/adr/0005).
 *
 * The hours are whole hours in the venue's own time. That is as fine as the
 * signal needs: it separates a closed room from an open one, and a member should
 * not have to type a timezone to be paid.
 */
export const UNSTATED = "none";

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

export interface StatedHours {
  openHour: number | null;
  closeHour: number | null;
  timezone: string | null;
}

/** The zone the screen stands in, read off the browser rather than asked for. */
export function browserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export function statedHoursOf(device: Device): StatedHours {
  return {
    openHour: device.openHour,
    closeHour: device.closeHour,
    timezone: device.timezone,
  };
}

function toHour(value: string): number | null {
  return value === UNSTATED ? null : Number(value);
}

/**
 * One hour without the other states no window, so clearing either clears both.
 * The API refuses a half-stated window, and the form must not be able to send one.
 */
export function OpenHoursFields({
  value,
  onChange,
  idPrefix,
}: {
  value: StatedHours;
  onChange: (next: StatedHours) => void;
  idPrefix: string;
}) {
  function set(field: "openHour" | "closeHour", raw: string) {
    const hour = toHour(raw);
    const next = { ...value, [field]: hour };
    if (hour === null) {
      next.openHour = null;
      next.closeHour = null;
    }
    onChange({ ...next, timezone: next.openHour === null ? null : browserTimezone() });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-open`}>Open hours</Label>
      <div className="flex items-center gap-2">
        <Select
          value={value.openHour === null ? UNSTATED : String(value.openHour)}
          onValueChange={(raw) => set("openHour", raw)}
        >
          <SelectTrigger id={`${idPrefix}-open`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSTATED}>Not stated</SelectItem>
            {HOURS.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">to</span>
        <Select
          value={value.closeHour === null ? UNSTATED : String(value.closeHour)}
          onValueChange={(raw) => set("closeHour", raw)}
          disabled={value.openHour === null}
        >
          <SelectTrigger id={`${idPrefix}-close`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSTATED}>Not stated</SelectItem>
            {HOURS.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        When this room is open, in its own time. A payout review counts the plays that fall outside
        it. Leave it unstated and nothing is counted against you.
      </p>
    </div>
  );
}
