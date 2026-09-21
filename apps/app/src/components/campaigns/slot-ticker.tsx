import { Plus } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import { cn } from "@repo/ui";
import { type LoopBand, type SlotPosition, clipCopy } from "../../lib/slots";

/** What the member types in the dialog, drawn on the position they picked. */
export interface SlotDraft {
  position: SlotPosition;
  name: string;
  tagline: string;
  logoUrl: string | null;
}

/**
 * The number an open band carries, so the pick and the place on the loop agree.
 * It sits large and pale in the bottom left corner. A booked band shows no
 * number: the brand fills it, and the position stays in its label for a reader.
 */
function PositionLabel({ position }: { position: SlotPosition }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-1 left-2 text-3xl leading-none font-semibold text-primary/10 tabular-nums"
    >
      {position}
    </span>
  );
}

function BrandBand({
  position,
  name,
  tagline,
  logoUrl,
  tone,
}: {
  position: SlotPosition;
  name: string;
  tagline: string;
  logoUrl: string | null;
  /** `mine` is a band the member holds; `draft` is the one the dialog writes now. */
  tone: "other" | "mine" | "draft";
}) {
  return (
    <li
      data-slot-position={position}
      aria-label={`Slot ${position}: ${name}${tone === "other" ? "" : ", your brand"}`}
      className={cn(
        "relative flex h-20 min-w-0 items-center justify-center gap-3 rounded-md border px-3",
        tone === "other" ? "bg-muted/40" : "border-primary bg-primary/10",
      )}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-9 shrink-0 rounded-md object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/10 text-base font-medium"
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-base leading-tight font-medium">
          {clipCopy(name, economy.slot.nameMaxLength)}
        </span>
        <span className="block truncate text-sm leading-tight text-muted-foreground">
          {clipCopy(tagline, economy.slot.taglineMaxLength)}
        </span>
      </span>
    </li>
  );
}

function OpenBand({
  position,
  onPick,
}: {
  position: SlotPosition;
  onPick?: (position: SlotPosition) => void;
}) {
  return (
    <li data-slot-position={position} className="min-w-0">
      <button
        type="button"
        onClick={() => onPick?.(position)}
        disabled={!onPick}
        aria-label={`Slot ${position}, open. Book this slot`}
        className="relative flex h-20 w-full items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors duration-150 hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:pointer-events-none"
      >
        <PositionLabel position={position} />
        <Plus size={20} weight="bold" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Rows the loop takes on a wide page. Fewer rows make each band smaller. */
const ROWS = 4;

/**
 * The loop, laid flat in four rows: every band in its position, from 1 to the
 * last. It does not crawl, because a band that moves is hard to press. A press
 * on an open band picks that position, and the brand then holds the same
 * position on the ticker.
 */
export function SlotTicker({
  bands,
  draft = null,
  onPick,
  className,
}: {
  bands: LoopBand[];
  draft?: SlotDraft | null;
  /** Absent when the loop is only shown and nothing can be picked. */
  onPick?: (position: SlotPosition) => void;
  className?: string;
}) {
  // Four rows hold the whole loop. A phone is too narrow for five bands, so it takes more rows.
  const perRow = Math.ceil(bands.length / ROWS);
  return (
    <ul
      aria-label="Ticker slots"
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-[repeat(var(--per-row),minmax(0,1fr))]",
        className,
      )}
      style={{ ["--per-row" as string]: String(perRow) }}
    >
      {bands.map((band) => {
        if (draft && band.position === draft.position && band.kind === "open") {
          return (
            <BrandBand
              key={band.position}
              position={band.position}
              name={draft.name}
              tagline={draft.tagline}
              logoUrl={draft.logoUrl}
              tone="draft"
            />
          );
        }
        if (band.kind === "open") {
          return <OpenBand key={band.position} position={band.position} onPick={onPick} />;
        }
        return (
          <BrandBand
            key={band.position}
            position={band.position}
            name={band.name}
            tagline={band.tagline}
            logoUrl={band.logoUrl}
            tone={band.campaignId ? "mine" : "other"}
          />
        );
      })}
    </ul>
  );
}
