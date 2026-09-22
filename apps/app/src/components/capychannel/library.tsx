import { Info } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ACCEPT,
  CAPS,
  type LibraryItem,
  type MediaKind,
  kindOf,
  readConsent,
  readLibrary,
  refusal,
  toPlay,
  toggle,
  writeConsent,
  writeLibrary,
} from "../../lib/library";
import { uploadChannelMedia } from "../../lib/uploads";
import { UploadConsentDialog } from "./upload-consent";

/** Dashed frames fill the row up to this many slots. Named, so each has a stable key. */
const BLANK_SLOTS = ["one", "two", "three", "four"] as const;

type Pending = {
  id: string;
  file: File;
  kind: MediaKind;
  previewUrl: string;
  progress: number;
  error: string | null;
};

/**
 * The member's pictures and clips, on the set: a round back button, one row of
 * thumbnails, and the Upload and Play pills under it. Click a thumbnail to
 * select it; Play plays the selection, or everything when nothing is selected.
 * The red x on a thumbnail shows on hover and takes the file off this set.
 * Upload opens the file picker, after the member has agreed once that files
 * go to our server.
 */
export function Library({
  userId,
  onBack,
  onPlay,
}: {
  userId: string;
  onBack: () => void;
  onPlay: (items: LibraryItem[]) => void;
}) {
  const [items, setItems] = useState<LibraryItem[]>(() => readLibrary(userId));
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [pending, setPending] = useState<Pending[]>([]);
  const [consentOpen, setConsentOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    setItems(readLibrary(userId));
    setSelected(new Set());
  }, [userId]);

  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function save(next: LibraryItem[]) {
    setItems(next);
    writeLibrary(userId, next);
  }

  function openPicker() {
    fileRef.current?.click();
  }

  function add() {
    if (readConsent(userId)) openPicker();
    else setConsentOpen(true);
  }

  function agree() {
    writeConsent(userId);
    setConsentOpen(false);
    openPicker();
  }

  function patchPending(id: string, patch: Partial<Pending>) {
    setPending((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function dropPending(id: string) {
    setPending((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) {
        URL.revokeObjectURL(gone.previewUrl);
        previews.current.delete(gone.previewUrl);
      }
      return list.filter((p) => p.id !== id);
    });
  }

  async function upload(entry: Pending) {
    patchPending(entry.id, { progress: 0, error: null });
    try {
      const url = await uploadChannelMedia(entry.file, (fraction) =>
        patchPending(entry.id, { progress: fraction }),
      );
      const item: LibraryItem = {
        id: entry.id,
        url,
        kind: entry.kind,
        name: entry.file.name,
        size: entry.file.size,
        addedAt: new Date().toISOString(),
      };
      setItems((list) => {
        const next = [...list, item];
        writeLibrary(userId, next);
        return next;
      });
      dropPending(entry.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The upload failed";
      patchPending(entry.id, { error: message });
      explain(entry.file.name, message, () => void upload(entry));
    }
  }

  /** The tile shows only the mark. The words, and the way back, are the toast. */
  function explain(name: string, message: string, retry: () => void) {
    toast.error(`${name}: ${message}`, { action: { label: "Retry", onClick: retry } });
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = [...(event.target.files ?? [])];
    // Cleared, so the same files can be chosen a second time.
    event.target.value = "";
    const accepted: Pending[] = [];
    for (const file of chosen) {
      const why = refusal(file);
      if (why) {
        toast.error(why);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      accepted.push({
        id: crypto.randomUUID(),
        file,
        kind: kindOf(file),
        previewUrl,
        progress: 0,
        error: null,
      });
    }
    if (accepted.length === 0) return;
    setPending((list) => [...list, ...accepted]);
    for (const entry of accepted) void upload(entry);
  }

  /** Off the set at once, with one way back. The file stays on the server. */
  function remove(item: LibraryItem) {
    const before = items;
    save(items.filter((row) => row.id !== item.id));
    setSelected((set) => {
      if (!set.has(item.id)) return set;
      const next = new Set(set);
      next.delete(item.id);
      return next;
    });
    toast(`Removed ${item.name}`, {
      action: { label: "Undo", onClick: () => save(before) },
    });
  }

  const count = selected.size;
  const empty = items.length === 0 && pending.length === 0;
  // A short library still reads as a row with room in it.
  const blanks = BLANK_SLOTS.slice(
    0,
    Math.max(0, BLANK_SLOTS.length - items.length - pending.length),
  );

  return (
    <div className="boot-lib" data-empty={empty || undefined}>
      <div className="boot-lib-head">
        <button type="button" className="boot-lib-back" aria-label="Back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.6 6.2 8.8 12l5.8 5.8" />
          </svg>
        </button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="boot-lib-info" aria-label={CAPS}>
                <Info weight="bold" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-sm">
              {CAPS}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* The strip holds the row.s height in the block. The row itself spans the
          screen, so a long library scrolls to both edges. */}
      <div className="boot-lib-strip">
        <div className="boot-lib-row">
          {blanks.map((slot) => (
            <div key={slot} className="boot-lib-tile boot-lib-blank" aria-hidden="true" />
          ))}

          {items.map((item) => {
            const on = selected.has(item.id);
            return (
              <div key={item.id} className="boot-lib-tile" data-selected={on || undefined}>
                <button
                  type="button"
                  className="boot-lib-pick"
                  aria-pressed={on}
                  aria-label={item.name}
                  onClick={() => setSelected((set) => toggle(set, item.id))}
                >
                  <span className="boot-lib-thumb">
                    {item.kind === "video" ? (
                      <video src={item.url} muted playsInline preload="metadata" />
                    ) : (
                      <img src={item.url} alt="" />
                    )}
                  </span>
                  {item.kind === "video" ? <span className="boot-lib-label">Video</span> : null}
                  <span className="boot-lib-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 12.5 3.8 3.8L18 8" />
                    </svg>
                  </span>
                </button>
                <button
                  type="button"
                  className="boot-lib-x"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => remove(item)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
                  </svg>
                </button>
              </div>
            );
          })}

          {pending.map((entry) => (
            <div
              key={entry.id}
              className="boot-lib-tile"
              data-pending
              data-failed={entry.error ? "" : undefined}
            >
              <div className="boot-lib-pick">
                <span className="boot-lib-thumb">
                  {entry.kind === "video" ? (
                    <video src={entry.previewUrl} muted playsInline preload="metadata" />
                  ) : (
                    <img src={entry.previewUrl} alt="" />
                  )}
                </span>
                {entry.kind === "video" ? <span className="boot-lib-label">Video</span> : null}
                {entry.error ? (
                  <span className="boot-lib-fail">
                    <button
                      type="button"
                      aria-label={`${entry.file.name} failed to upload. Show why`}
                      onClick={() =>
                        explain(entry.file.name, entry.error ?? "", () => void upload(entry))
                      }
                    >
                      !
                    </button>
                  </span>
                ) : (
                  <span className="boot-lib-progress" aria-hidden="true">
                    <span style={{ width: `${Math.round(entry.progress * 100)}%` }} />
                  </span>
                )}
                <span className="sr-only">
                  {entry.error
                    ? `${entry.file.name} failed to upload`
                    : `Uploading ${entry.file.name}, ${Math.round(entry.progress * 100)}%`}
                </span>
              </div>
              <button
                type="button"
                className="boot-lib-x"
                aria-label={`Remove ${entry.file.name}`}
                onClick={() => dropPending(entry.id)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="boot-lib-actions">
        <button type="button" className="boot-lib-upload" data-first onClick={add}>
          Upload
        </button>
        <button
          type="button"
          className="boot-lib-play"
          disabled={items.length === 0}
          onClick={() => onPlay(toPlay(items, selected))}
        >
          {count > 0 ? `Play ${count}` : "Play"}
        </button>
      </div>

      <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={onFiles} />

      <UploadConsentDialog open={consentOpen} onOpenChange={setConsentOpen} onAgree={agree} />
    </div>
  );
}
