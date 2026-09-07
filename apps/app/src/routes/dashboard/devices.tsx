import { Monitor, Plus } from "@phosphor-icons/react";
import type { DeviceWithTerms, VenueType } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { DeviceDetail } from "../../components/devices/device-detail";
import { DeviceTile } from "../../components/devices/device-tile";
import { useCreateDevice, useDevices } from "../../lib/devices";
import { usePlacements } from "../../lib/placements";

/** Every venue the API accepts, named for a member. The record is the list, so a
    new venue type fails typecheck here until it is named. */
const VENUE_LABEL: Record<VenueType, string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  salon: "Salon",
  gym: "Gym",
  clinic: "Clinic",
  retail: "Shop",
  office: "Office",
  other: "Somewhere else",
};

const VENUE_TYPES = Object.keys(VENUE_LABEL) as VenueType[];

export function DevicesPage() {
  const { data: devices, isLoading } = useDevices();
  const { data: placements } = usePlacements();
  const create = useCreateDevice();

  const [addOpen, setAddOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [venueType, setVenueType] = useState<VenueType>("cafe");
  const [openItem, setOpenItem] = useState<DeviceWithTerms | null>(null);

  const regionCount = new Map<string, number>();
  for (const placement of placements ?? []) {
    regionCount.set(placement.deviceId, (regionCount.get(placement.deviceId) ?? 0) + 1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;
    create.mutate(
      { location: location.trim(), venueType },
      {
        onSuccess: (created) => {
          setAddOpen(false);
          setLocation("");
          setVenueType("cafe");
          setOpenItem(created);
          toast.success("Device registered. An admin reviews it next.");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  // The list holds what the API returned, so an open detail must read from it:
  // a rotated key or a new region must reach the dialog without a reopen.
  const current = openItem
    ? (devices?.find((row) => row.device.id === openItem.device.id) ?? openItem)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="rounded-full"
              onClick={() => setAddOpen(true)}
              aria-label="New device"
            >
              <Plus size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New device</TooltipContent>
        </Tooltip>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {devices && devices.length === 0 && (
        <EmptyState
          icon={<Monitor />}
          title="No device yet"
          description="Register a screen, install CapyTV on it, and it starts earning once an admin approves it."
          action={<Button onClick={() => setAddOpen(true)}>Register a device</Button>}
        />
      )}

      {/* No gap: each tile draws its own right and bottom rule, the same grid the
          Campaigns page uses. */}
      {devices && devices.length > 0 && (
        <div className="-mx-6 border-t">
          <div className="-mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {devices.map((item) => (
              <DeviceTile
                key={item.device.id}
                item={item}
                placements={regionCount.get(item.device.id) ?? 0}
                onOpen={() => setOpenItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Where the screen stands and what kind of room it is. An admin prices the
          tier off exactly these two answers, so nothing else is asked. */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>New device</DialogTitle>
              <DialogDescription>
                Tell us where the screen stands. An admin reviews it and sets its tier.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="device-location">Location</Label>
                <Input
                  id="device-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="Front counter, Jalan Telawi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-venue">Venue</Label>
                <Select value={venueType} onValueChange={(v) => setVenueType(v as VenueType)}>
                  <SelectTrigger id="device-venue" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUE_TYPES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {VENUE_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || !location.trim()}>
                {create.isPending ? "Registering…" : "Register device"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {current && (
        <DeviceDetail item={current} open onOpenChange={(next) => !next && setOpenItem(null)} />
      )}
    </div>
  );
}
