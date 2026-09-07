import { MapPin, Monitor } from "@phosphor-icons/react";
import type { DeviceWithTerms } from "@repo/contracts/types";
import { Badge } from "@repo/ui";
import { StatusBadge } from "../status-badge";

const TIER_LABEL: Record<DeviceWithTerms["device"]["tier"], string> = {
  standard: "Standard",
  premium: "Premium",
  flagship: "Flagship",
};

/**
 * One device as a grid cell, drawn like a listing tile: the cell owns its right
 * and bottom rule, so the grid needs no gap and no wrapper box.
 *
 * The whole tile is the button. There is one thing to do with a device — open it
 * — so a separate "open" control would be furniture.
 */
export function DeviceTile({
  item,
  placements,
  onOpen,
}: {
  item: DeviceWithTerms;
  /** How many regions the device holds. One plays at a time. */
  placements: number;
  onOpen: () => void;
}) {
  const { device } = item;
  const approved = device.state === "approved";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-44 cursor-pointer flex-col gap-4 border-r border-b p-5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      aria-label={`Open the device at ${device.location}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <Monitor size={12} />
          CapyTV
        </Badge>
        <StatusBadge status={device.state} />
      </div>

      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          <MapPin size={14} className="shrink-0 text-muted-foreground" />
          {device.location}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">{device.deviceId}</p>
      </div>

      {/* mt-auto pins the line to the bottom rule, so it sits level across the
          whole grid however long the location above it runs. */}
      <p className="mt-auto text-xs text-muted-foreground">
        {approved
          ? `${TIER_LABEL[device.tier]} · ${placements} ${placements === 1 ? "region" : "regions"} · up to ${device.dailyPlayCap.toLocaleString()} plays a day`
          : "An admin reviews the screen before it earns."}
      </p>
    </button>
  );
}
