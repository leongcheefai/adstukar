import { Television } from "@phosphor-icons/react";
import { project } from "@repo/config/project";
import type { DeviceWithTerms } from "@repo/contracts/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Label,
} from "@repo/ui";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useArchiveDevice, useDevices, useRenameDevice } from "../../lib/devices";

type Device = DeviceWithTerms["device"];

const STATE: Record<
  Device["state"],
  { label: string; variant: "success" | "warning" | "destructive" | "outline" }
> = {
  pending: { label: "Waiting for approval", variant: "warning" },
  approved: { label: "Earning", variant: "success" },
  rejected: { label: "Not approved", variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
};

function RenameDialog({
  device,
  open,
  onOpenChange,
}: { device: Device; open: boolean; onOpenChange: (open: boolean) => void }) {
  const rename = useRenameDevice();
  const [name, setName] = useState(device.name);

  function submit(event: FormEvent) {
    event.preventDefault();
    rename.mutate(
      { id: device.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Screen renamed");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename {device.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`rename-${device.id}`}>Screen name</Label>
            <Input
              id={`rename-${device.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
          </div>
          <Button type="submit" className="w-full" disabled={rename.isPending}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDialog({
  device,
  open,
  onOpenChange,
}: { device: Device; open: boolean; onOpenChange: (open: boolean) => void }) {
  const archive = useArchiveDevice();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive {device.name}?</DialogTitle>
          <DialogDescription>
            The screen stops earning. Its set goes back to an unpaid set the next time it checks in.
            What it already earned stays in your wallet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            disabled={archive.isPending}
            onClick={() =>
              archive.mutate(device.id, {
                onSuccess: () => {
                  toast.success("Screen archived");
                  onOpenChange(false);
                },
                onError: (err) => toast.error(err.message),
              })
            }
          >
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScreenRow({ device }: { device: Device }) {
  const [renaming, setRenaming] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const state = STATE[device.state];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start">
        {device.photoUrl ? (
          <img
            src={device.photoUrl}
            alt={`The screen at ${device.location}`}
            className="h-24 w-36 shrink-0 rounded-md object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{device.name}</p>
            <Badge variant={state.variant}>{state.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{device.location}</p>
          {device.state === "rejected" && device.rejectionReason ? (
            <p className="text-sm text-destructive">{device.rejectionReason}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => setRenaming(true)}>
            Rename
          </Button>
          <Button size="sm" variant="outline" onClick={() => setArchiving(true)}>
            Archive
          </Button>
        </div>
      </CardContent>
      <RenameDialog device={device} open={renaming} onOpenChange={setRenaming} />
      <ArchiveDialog device={device} open={archiving} onOpenChange={setArchiving} />
    </Card>
  );
}

/** Every screen this member registered. A screen is added from the set it runs on, not here. */
export function ScreensPage() {
  const { data: items, isLoading } = useDevices();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Screens</h1>
        <p className="text-sm text-muted-foreground">
          The screens you registered, and where each one's review stands.
        </p>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {items && items.length === 0 ? (
        <EmptyState
          icon={<Television />}
          title="No screens yet"
          description={`Open the ${project.name} set on the screen in your venue, then choose “Earn from this screen” in the account menu.`}
        />
      ) : null}
      {items?.map((item) => (
        <ScreenRow key={item.device.id} device={item.device} />
      ))}
    </div>
  );
}
