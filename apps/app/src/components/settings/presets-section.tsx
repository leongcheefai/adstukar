import {
  ArrowSquareOut,
  DotsThree,
  FolderSimplePlus,
  Images,
  PencilSimple,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { acceptsImage, media, megabytes } from "@repo/config/media";
import type { PresetCollection, PresetMedia } from "@repo/contracts/types";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  Label,
} from "@repo/ui";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IMAGE_LIMIT, type MediaKind } from "../../lib/library";
import {
  useDeleteCollection,
  useDeletePreset,
  usePresets,
  useUpdatePreset,
  useUploadPreset,
} from "../../lib/presets";
import { PresetCollectionDialog } from "./preset-collection-dialog";

/** The contract caps a name at this length; the field does too, so a paste cannot fail late. */
const NAME_MAX = 120;

/** What the picker accepts: the list the preset presign accepts. */
const ACCEPT_IMAGES = media.image.types.join(",");

type Pending = {
  id: string;
  collectionId: string;
  name: string;
  previewUrl: string;
  progress: number;
};

/** "photo.final.png" reads as "photo.final": the name on the tile. */
function nameOf(file: File): string {
  const bare = file.name.replace(/\.[^.]+$/, "").trim();
  return (bare || "Untitled").slice(0, NAME_MAX);
}

/** Small files in KB, the rest in MB with one decimal, so a 300 KB photo does not read "0 MB". */
function sizeOf(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why a file cannot go up, or null when it can: the rule the preset presign applies. */
function refusal(file: File): string | null {
  if (acceptsImage(file)) return null;
  if (!(media.image.types as readonly string[]).includes(file.type)) {
    return `${file.name} is not a PNG, JPEG or WebP.`;
  }
  return `${file.name} is ${megabytes(file.size)}. A photo goes up to ${megabytes(media.image.maxBytes)}.`;
}

/** "unsplash.com/@first_designs": the link without its scheme, for a header. */
function shortLink(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
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
      {kind === "video" ? (
        <Badge variant="neutral" className="absolute top-2 left-2">
          Video
        </Badge>
      ) : null}
    </div>
  );
}

/**
 * The preset desk. Each collection here is one tile on every member's
 * Wallpaper channel: its name sits under the tile, its photos play one at a
 * time, and a click on any of them opens the collection's link. A member
 * plays a collection and cannot change it; only this desk adds, edits, moves,
 * or removes one. A photo goes up at the cap a member's own photo takes,
 * because it plays on the same screens.
 */
export function PresetsSection() {
  const { data, isLoading, isError } = usePresets();
  const upload = useUploadPreset();
  const update = useUpdatePreset();
  const removePhoto = useDeletePreset();
  const removeCollection = useDeleteCollection();
  const [pending, setPending] = useState<Pending[]>([]);
  const [editing, setEditing] = useState<PresetCollection | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [dropping, setDropping] = useState<PresetCollection | null>(null);
  const [renaming, setRenaming] = useState<PresetMedia | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<PresetMedia | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const collections = data?.collections ?? [];
  const items = data?.items ?? [];
  const known = new Set(collections.map((collection) => collection.id));
  const loose = items.filter((item) => !item.collectionId || !known.has(item.collectionId));

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
        collectionId: entry.collectionId,
        onProgress: (progress) =>
          setPending((list) => list.map((p) => (p.id === entry.id ? { ...p, progress } : p))),
      });
      toast.success(`Added ${preset.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The upload failed";
      toast.error(`${file.name}: ${message}`, {
        action: { label: "Retry", onClick: () => start(file, entry.collectionId) },
      });
    } finally {
      dropPending(entry.id);
    }
  }

  function start(file: File, collectionId: string) {
    const previewUrl = URL.createObjectURL(file);
    previews.current.add(previewUrl);
    const entry: Pending = {
      id: crypto.randomUUID(),
      collectionId,
      name: nameOf(file),
      previewUrl,
      progress: 0,
    };
    setPending((list) => [...list, entry]);
    void send(file, entry);
  }

  function pickFor(collectionId: string) {
    target.current = collectionId;
    fileRef.current?.click();
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = [...(event.target.files ?? [])];
    // Cleared, so the same file can be chosen a second time.
    event.target.value = "";
    const collectionId = target.current;
    if (!collectionId) return;
    for (const file of chosen) {
      const why = refusal(file);
      if (why) toast.error(why);
      else start(file, collectionId);
    }
  }

  function openCollection(collection: PresetCollection | null) {
    setEditing(collection);
    setCollectionOpen(true);
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
    update.mutate(
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

  function move(preset: PresetMedia, collection: PresetCollection) {
    update.mutate(
      { id: preset.id, collectionId: collection.id },
      {
        onSuccess: () => toast.success(`Moved ${preset.name} to ${collection.name}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function confirmDeletePhoto() {
    if (!deleting) return;
    const doomed = deleting;
    removePhoto.mutate(doomed.id, {
      onSuccess: () => {
        toast.success(`Removed ${doomed.name}`);
        setDeleting(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function confirmDeleteCollection() {
    if (!dropping) return;
    const doomed = dropping;
    removeCollection.mutate(doomed.id, {
      onSuccess: () => {
        toast.success(`Removed ${doomed.name}`);
        setDropping(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  /** A plain function, not a component: a component made here would remount on every render. */
  function photoCard(preset: PresetMedia) {
    const elsewhere = collections.filter((collection) => collection.id !== preset.collectionId);
    const movable = preset.kind === "image" && elsewhere.length > 0;
    return (
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${preset.name}`}>
                <DotsThree weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openRename(preset)}>
                <PencilSimple />
                Rename
              </DropdownMenuItem>
              {movable ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Images />
                    Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {elsewhere.map((collection) => (
                      <DropdownMenuItem
                        key={collection.id}
                        onSelect={() => move(preset, collection)}
                      >
                        {collection.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleting(preset)}
              >
                <Trash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
    );
  }

  const empty = !isLoading && !isError && collections.length === 0 && loose.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{IMAGE_LIMIT}.</p>
        <Button onClick={() => openCollection(null)}>
          <FolderSimplePlus weight="bold" />
          New collection
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_IMAGES}
          multiple
          hidden
          onChange={onFiles}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">The presets did not load.</p>}

      {empty && (
        <EmptyState
          icon={<Images />}
          title="No collections yet"
          description="Create a collection, give it a link, then upload its photos. It shows as one tile on every member's Wallpaper channel."
        />
      )}

      {collections.map((collection) => {
        const photos = items.filter((item) => item.collectionId === collection.id);
        const uploading = pending.filter((entry) => entry.collectionId === collection.id);
        return (
          <section key={collection.id} className="space-y-4 rounded-2xl border p-4">
            <header className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate font-medium" title={collection.name}>
                  {collection.name}
                </h3>
                <a
                  href={collection.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">{shortLink(collection.url)}</span>
                  <ArrowSquareOut className="shrink-0" />
                </a>
                <p className="text-xs text-muted-foreground">
                  {collection.author ? `Photo by ${collection.author}` : "No credit"} ·{" "}
                  {photos.length === 1 ? "1 photo" : `${photos.length} photos`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => pickFor(collection.id)}>
                  <UploadSimple weight="bold" />
                  Upload
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${collection.name}`}
                  onClick={() => openCollection(collection)}
                >
                  <PencilSimple />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${collection.name}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDropping(collection)}
                >
                  <Trash />
                </Button>
              </div>
            </header>

            {photos.length === 0 && uploading.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos yet. Members do not see a collection until it has one.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map(photoCard)}
                {uploading.map((entry) => (
                  <li key={entry.id} className="rounded-xl border bg-card opacity-80">
                    <Thumb kind="image" url={entry.previewUrl} />
                    <div className="space-y-2 p-3">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        aria-hidden="true"
                      >
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
          </section>
        );
      })}

      {loose.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-dashed p-4">
          <header className="space-y-1">
            <h3 className="font-medium">Not in a collection</h3>
            <p className="text-sm text-muted-foreground">
              Added before collections. Members do not see these: move a photo into a collection, or
              delete it. A clip cannot be a wallpaper.
            </p>
          </header>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loose.map(photoCard)}
          </ul>
        </section>
      )}

      <PresetCollectionDialog
        open={collectionOpen}
        editing={editing}
        onClose={() => setCollectionOpen(false)}
      />

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <form onSubmit={saveName} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Rename photo</DialogTitle>
              <DialogDescription>Only this desk shows the name.</DialogDescription>
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
              <Button type="submit" disabled={update.isPending || draft.trim() === ""}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting &&
                `${deleting.name} leaves its collection on every set, and storage. A set showing it now skips to the next photo. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePhoto.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Stay open until the delete answers, so it cannot be pressed twice.
                event.preventDefault();
                confirmDeletePhoto();
              }}
              disabled={removePhoto.isPending}
            >
              {removePhoto.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dropping !== null} onOpenChange={(open) => !open && setDropping(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {dropping &&
                `${dropping.name} and every photo in it leave every member's Wallpaper channel, and storage. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeCollection.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteCollection();
              }}
              disabled={removeCollection.isPending}
            >
              {removeCollection.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
