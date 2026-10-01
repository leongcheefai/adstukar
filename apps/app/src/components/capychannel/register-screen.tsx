import { acceptsImage, media, megabytes } from "@repo/config/media";
import type { VenueType } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { type FormEvent, useState } from "react";
import { useCreateDevice } from "../../lib/devices";
import { uploadDevicePhoto } from "../../lib/uploads";

/** Every venue type, in the order the picker shows them. The type makes the list complete. */
const VENUES: Record<VenueType, string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  salon: "Salon",
  gym: "Gym",
  clinic: "Clinic",
  retail: "Shop",
  office: "Office",
  other: "Other",
};

const HOURS = Array.from({ length: 24 }, (_, h) => String(h));

function clock(hour: string): string {
  return `${hour.padStart(2, "0")}:00`;
}

/** The screen's zone, read off the browser it runs in. The payout review reads the hours in it. */
function timezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function HourField({
  id,
  label,
  value,
  onChange,
}: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {clock(h)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Registers the set this browser runs as a screen (docs/adr/0016). The photo is
 * required: it is the evidence an admin approves from. The key the API answers
 * goes to `onRegistered`, and the set plays on it from then on.
 */
export function RegisterScreenDialog({
  open,
  onOpenChange,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (key: string) => void;
}) {
  const create = useCreateDevice();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [venueType, setVenueType] = useState<VenueType>("cafe");
  const [openHour, setOpenHour] = useState("9");
  const [closeHour, setCloseHour] = useState("21");
  const [photo, setPhoto] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = progress !== null || create.isPending;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!photo) {
      setError("Add a photo of the screen in place.");
      return;
    }
    if (!acceptsImage(photo)) {
      setError(`The photo must be PNG, JPEG or WebP, up to ${megabytes(media.image.maxBytes)}.`);
      return;
    }
    try {
      setProgress(0);
      const photoUrl = await uploadDevicePhoto(photo, setProgress);
      const created = await create.mutateAsync({
        name: name.trim(),
        location: location.trim(),
        venueType,
        photoUrl,
        openHour: Number(openHour),
        closeHour: Number(closeHour),
        timezone: timezone(),
      });
      onRegistered(created.device.apiKey);
      onOpenChange(false);
    } catch (err) {
      // The fields stay as they are, so a second try needs no retyping.
      setError(err instanceof Error ? err.message : "The screen was not registered.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Earn from this screen</DialogTitle>
          <DialogDescription>
            An admin reviews every screen. After approval, this screen earns for each brand that
            crosses it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="screen-name">Screen name</Label>
            <Input
              id="screen-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="Counter TV"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="screen-location">Where it is</Label>
            <Input
              id="screen-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              maxLength={120}
              placeholder="Kopi Bangsar, Jalan Telawi 3"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="screen-venue">Kind of venue</Label>
            <Select value={venueType} onValueChange={(v) => setVenueType(v as VenueType)}>
              <SelectTrigger id="screen-venue">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VENUES) as VenueType[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {VENUES[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HourField id="screen-open" label="Opens at" value={openHour} onChange={setOpenHour} />
            <HourField
              id="screen-close"
              label="Closes at"
              value={closeHour}
              onChange={setCloseHour}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="screen-photo">A photo of the screen in place</Label>
            <Input
              id="screen-photo"
              type="file"
              accept={media.image.types.join(",")}
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {progress !== null && progress < 1
              ? `Uploading ${Math.round(progress * 100)}%`
              : busy
                ? "Registering…"
                : "Register this screen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
