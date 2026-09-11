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
import { OpenHoursFields, type StatedHours } from "../../components/devices/open-hours";
import { uploadDevicePhoto, useCreateDevice, useDevices } from "../../lib/devices";
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

/** What the presign route and the copy below both accept. */
const PHOTO_TYPES = "image/png,image/jpeg,image/webp";
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export function DevicesPage() {
  const { data: devices, isLoading } = useDevices();
  const { data: placements } = usePlacements();
  const create = useCreateDevice();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [venueType, setVenueType] = useState<VenueType>("cafe");
  const [hours, setHours] = useState<StatedHours>({
    openHour: null,
    closeHour: null,
    timezone: null,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openItem, setOpenItem] = useState<DeviceWithTerms | null>(null);

  const regionCount = new Map<string, number>();
  for (const placement of placements ?? []) {
    regionCount.set(placement.deviceId, (regionCount.get(placement.deviceId) ?? 0) + 1);
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      toast.error("That photo is over 5 MB.");
      return;
    }
    setUploading(true);
    try {
      setPhotoUrl(await uploadDevicePhoto(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    create.mutate(
      { name: name.trim(), location: location.trim(), venueType, photoUrl, ...hours },
      {
        onSuccess: (created) => {
          setAddOpen(false);
          setName("");
          setLocation("");
          setVenueType("cafe");
          setHours({ openHour: null, closeHour: null, timezone: null });
          setPhotoUrl(null);
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

      {/* Where the screen stands, what kind of room it is, and a photo of it in
          place. An admin prices the tier off exactly these answers, and the photo
          is most of what stands in for device attestation — see docs/adr/0003. */}
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
                <Label htmlFor="device-name">Name</Label>
                <Input
                  id="device-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  placeholder="Counter screen"
                />
                <p className="text-xs text-muted-foreground">
                  What you call this screen. Only you ever see it.
                </p>
              </div>
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
              <OpenHoursFields value={hours} onChange={setHours} idPrefix="device-hours" />
              <div className="space-y-2">
                <Label htmlFor="device-photo">Photo of the screen in place</Label>
                <Input
                  id="device-photo"
                  type="file"
                  accept={PHOTO_TYPES}
                  disabled={uploading}
                  onChange={(e) => void pickPhoto(e.target.files?.[0])}
                />
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="The screen in place"
                    className="h-32 w-full rounded-md border object-cover"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    An admin approves a screen from this photo. PNG, JPEG or WebP, up to 5 MB.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || uploading || !name.trim() || !location.trim()}
              >
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
