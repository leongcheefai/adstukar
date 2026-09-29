import { Gift } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { CompedSlot } from "@repo/contracts/types";
import {
  Badge,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCompSlot, useCompedSlots } from "../../lib/admin";
import { useSlotLoop } from "../../lib/slots-api";

const DAY = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/** The same caps the member's booking form holds to, so a band never overflows. */
const NAME_MAX = economy.slot.nameMaxLength;
const TAGLINE_MAX = economy.slot.taglineMaxLength;

function termOf(slot: CompedSlot["slot"]): string {
  if (slot.state === "running" && slot.endsAt) return `Until ${DAY.format(new Date(slot.endsAt))}`;
  return "Waits on the domain check and review";
}

function CompedRow({ item }: { item: CompedSlot }) {
  const { slot, campaign, listing, owner } = item;
  return (
    <TableRow>
      <TableCell className="font-mono tabular-nums">#{slot.position}</TableCell>
      <TableCell className="min-w-0">
        <p data-usertext className="truncate font-medium">
          {campaign.name}
        </p>
        <p data-usertext className="truncate text-xs text-muted-foreground">
          {listing?.tagline ?? "No ad written yet"}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p data-usertext className="truncate">
          {owner.name}
        </p>
        <p data-usertext className="truncate font-mono text-xs text-muted-foreground">
          {owner.email}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant={slot.state === "running" ? "success" : "warning"} dot>
          {slot.state === "running" ? "Running" : "Booked"}
        </Badge>
        <p className="mt-1 text-xs text-muted-foreground">{termOf(slot)}</p>
      </TableCell>
    </TableRow>
  );
}

/**
 * The form an admin fills for a friend: whose account the slot goes to, and
 * the ad they would have typed themselves. The member edits it later as their
 * own, and the ad still goes through review before the term starts.
 */
function CompDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const comp = useCompSlot();
  const { data: loop } = useSlotLoop();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [position, setPosition] = useState<string>("");

  const openPositions = (loop?.bands ?? []).filter((b) => b.kind === "open").map((b) => b.position);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setName("");
    setUrl("");
    setTagline("");
    setPosition("");
  }, [open]);

  const link = url.trim();
  const linkOk = /^https:\/\/\S+\.\S+/i.test(link);
  const ready =
    email.trim() !== "" && name.trim() !== "" && tagline.trim() !== "" && linkOk && position !== "";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    comp.mutate(
      {
        email: email.trim(),
        name: name.trim(),
        url: link,
        tagline: tagline.trim(),
        position: Number(position),
      },
      {
        onSuccess: (row) => {
          toast.success(`Slot #${row.slot.position} given to ${row.owner.name}`);
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Give a slot</DialogTitle>
            <DialogDescription>
              The slot goes on the member's own account at no charge. It runs for{" "}
              {economy.slot.termDays} days once their domain is verified and the ad is approved, and
              the screens that play it are paid as for any other slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="comp-email">Member's email</Label>
            <Input
              id="comp-email"
              type="email"
              value={email}
              placeholder="owner@friend.com"
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              The email they signed up with. They need an account first.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-name">Brand</Label>
            <Input
              id="comp-name"
              value={name}
              maxLength={NAME_MAX}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-tagline">Tagline</Label>
            <Input
              id="comp-tagline"
              value={tagline}
              maxLength={TAGLINE_MAX}
              onChange={(event) => setTagline(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-url">Website</Label>
            <Input
              id="comp-url"
              type="url"
              inputMode="url"
              value={url}
              placeholder="https://friend.com"
              onChange={(event) => setUrl(event.target.value)}
              aria-invalid={link !== "" && !linkOk}
            />
            {link !== "" && !linkOk ? (
              <p className="text-xs text-destructive">The link must start with https://</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-position">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="comp-position" className="w-40">
                <SelectValue placeholder={openPositions.length ? "Pick one" : "Ring is full"} />
              </SelectTrigger>
              <SelectContent>
                {openPositions.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    Slot #{value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={comp.isPending || !ready}>
              {comp.isPending ? "Giving…" : "Give slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Complimentary slots (docs/adr/0014). An admin gives a member a slot for
 * nothing, up to a fixed number live at once. The slot is the member's own and
 * runs as a paid one does; the platform pays the screens with no revenue
 * behind it, so the pool card shows the cost.
 */
export function CompedSlotsSection() {
  const { data, isLoading } = useCompedSlots();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground tabular-nums">
          {data ? `${data.max - data.left} of ${data.max} in use` : null}
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={!data || data.left === 0}>
          <Gift size={14} />
          Give a slot
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {data?.items.length === 0 && (
        <EmptyState
          icon={<Gift />}
          title="No complimentary slots"
          description="A slot you give appears here until its term ends."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Term</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <CompedRow key={item.slot.id} item={item} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CompDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
