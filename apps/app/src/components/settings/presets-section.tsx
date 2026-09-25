import { FilmStrip, PencilSimple, Trash, UploadSimple } from "@phosphor-icons/react";
import type { PresetMedia } from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
} from "@repo/ui";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ACCEPT, CAPS, type MediaKind, kindOf, refusal } from "../../lib/library";
import { useDeletePreset, usePresets, useRenamePreset, useUploadPreset } from "../../lib/presets";

/** The contract caps a name at this length; the field does too, so a paste cannot fail late. */
const NAME_MAX = 120;

type Pending = {
  id: string;
  name: string;
  kind: MediaKind;
  previewUrl: string;
  progress: number;
};

/** "photo.final.png" reads as "photo.final": the name a member sees on the tile. */
function nameOf(file: File): string {
  const bare = file.name.replace(/\.[^.]+$/, "").trim();
  return (bare || "Untitled").slice(0, NAME_MAX);
}

/** Small files in KB, the rest in MB with one decimal, so a 300 KB photo does not read "0 MB". */
function sizeOf(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Thumb({ kind, url }: { kind: MediaKind; url: string }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted">
      {kind === "video" ? (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
      <Badge variant="neutral" className="absolute top-2 left-2">
        {kind === "video" ? "Video" : "Photo"}
      </Badge>
    </div>
  );
}

/**
 * The preset desk. The pictures and clips here sit at the front of every
 * member's Images/Video library, so a new set has something to play before
 * its member uploads a thing. A member plays a preset and cannot delete it;
 * only this desk renames or removes one. A file goes up at the caps a
 * member's own file takes, because it plays on the same screens.
 */
export function PresetsSection() {
  const { data, isLoading, isError } = usePresets();
  const upload = useUploadPreset();
  const rename = useRenamePreset();
  const remove = useDeletePreset();
  const [pending, setPending] = useState<Pending[]>([]);
  const [renaming, setRenaming] = useState<PresetMedia | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<PresetMedia | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

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

  /**
   * `mutateAsync`, not `mutate` with callbacks: several files go up at once,
   * and a mutation's per-call callbacks fire for the latest call only.
   */
  async function send(file: File, entry: Pending) {
    try {
      const preset = await upload.mutateAsync({
        file,
        name: entry.name,
        onProgress: (progress) =>
          setPending((list) => list.map((p) => (p.id === entry.id ? { ...p, progress } : p))),
      });
      toast.success(`Added ${preset.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The upload failed";
      toast.error(`${file.name}: ${message}`, {
        action: { label: "Retry", onClick: () => start(file) },
      });
    } finally {
      dropPending(entry.id);
    }
  }

  function start(file: File) {
    const previewUrl = URL.createObjectURL(file);
    previews.current.add(previewUrl);
    const entry: Pending = {
      id: crypto.randomUUID(),
      name: nameOf(file),
      kind: kindOf(file),
      previewUrl,
      progress: 0,
    };
    setPending((list) => [...list, entry]);
    void send(file, entry);
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = [...(event.target.files ?? [])];
    // Cleared, so the same file can be chosen a second time.
    event.target.value = "";
    for (const file of chosen) {
      const why = refusal(file);
      if (why) toast.error(why);
      else start(file);
    }
  }

  function openRename(preset: PresetMedia) {
    setDraft(preset.name);
    setRenaming(preset);
  }

  function saveName(event: FormEvent) {
    event.preventDefault();
    if (!renaming) return;
    const name = draft.trim();
    if (!name || name === renaming.name) {
      setRenaming(null);
      return;
    }
    rename.mutate(
      { id: renaming.id, name },
      {
        onSuccess: () => {
          toast.success("Renamed");
          setRenaming(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    remove.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Removed ${target.name}`);
        setDeleting(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  const items = data?.items ?? [];
  const empty = !isLoading && !isError && items.length === 0 && pending.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{CAPS}. PNG, JPEG, WebP or MP4.</p>
        <Button onClick={() => fileRef.current?.click()}>
          <UploadSimple weight="bold" />
          Upload
        </Button>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={onFiles} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">The presets did not load.</p>}

      {empty && (
        <EmptyState
          icon={<FilmStrip />}
          title="No presets yet"
          description="Upload a photo or a clip, and it shows at the front of every member's library."
        />
      )}

      {(items.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((preset) => (
            <li key={preset.id} className="rounded-xl border bg-card">
              <Thumb kind={preset.kind} url={preset.url} />
              <div className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={preset.name}>
                    {preset.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sizeOf(preset.size)} · {new Date(preset.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Rename ${preset.name}`}
                  onClick={() => openRename(preset)}
                >
                  <PencilSimple />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${preset.name}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(preset)}
                >
                  <Trash />
                </Button>
              </div>
            </li>
          ))}

          {pending.map((entry) => (
            <li key={entry.id} className="rounded-xl border bg-card opacity-80">
              <Thumb kind={entry.kind} url={entry.previewUrl} />
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium">{entry.name}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${Math.round(entry.progress * 100)}%` }}
                  />
                </div>
                <span className="sr-only">
                  Uploading {entry.name}, {Math.round(entry.progress * 100)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <form onSubmit={saveName} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Rename preset</DialogTitle>
              <DialogDescription>Members see this name in their library.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="preset-name">Name</Label>
              <Input
                id="preset-name"
                value={draft}
                maxLength={NAME_MAX}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={rename.isPending || draft.trim() === ""}>
                {rename.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this preset?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting &&
                `${deleting.name} leaves every member's library and storage. A set playing it now skips to the next file. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Stay open until the delete answers, so it cannot be pressed twice.
                event.preventDefault();
                confirmDelete();
              }}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
