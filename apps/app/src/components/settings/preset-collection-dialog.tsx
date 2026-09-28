import type { PresetCollection } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSaveCollection } from "../../lib/presets";

/** The contract's caps, so a paste cannot fail late. */
const NAME_MAX = 80;
const AUTHOR_MAX = 80;
const URL_MAX = 2048;

/**
 * A new wallpaper collection, or an edit of one: its name, the page every one
 * of its photos opens, and who the set credits under each photo. `editing` is
 * the collection being edited, or null for a new one.
 */
export function PresetCollectionDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PresetCollection | null;
  onClose: () => void;
  onSaved?: (collection: PresetCollection) => void;
}) {
  const save = useSaveCollection();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setUrl(editing?.url ?? "");
    setAuthor(editing?.author ?? "");
  }, [open, editing]);

  const link = url.trim();
  const linkOk = /^https:\/\/\S+\.\S+/i.test(link);
  const ready = name.trim() !== "" && linkOk;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    save.mutate(
      { id: editing?.id, name: name.trim(), url: link, author: author.trim() || null },
      {
        onSuccess: (collection) => {
          toast.success(editing ? "Collection saved" : `Created ${collection.name}`);
          onSaved?.(collection);
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
            <DialogTitle>{editing ? "Edit collection" : "New collection"}</DialogTitle>
            <DialogDescription>
              Members see the name under its tile on the Wallpaper channel. A click on any of its
              photos opens the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              maxLength={NAME_MAX}
              placeholder="Jack Berry Collection"
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-url">Link</Label>
            <Input
              id="collection-url"
              type="url"
              inputMode="url"
              value={url}
              maxLength={URL_MAX}
              placeholder="https://unsplash.com/@first_designs"
              onChange={(event) => setUrl(event.target.value)}
              aria-invalid={link !== "" && !linkOk}
            />
            {link !== "" && !linkOk ? (
              <p className="text-xs text-destructive">The link must start with https://</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-author">Photo by (optional)</Label>
            <Input
              id="collection-author"
              value={author}
              maxLength={AUTHOR_MAX}
              placeholder="Jack Berry"
              onChange={(event) => setAuthor(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown as “Photo by …” on each photo. Left blank, the collection's name shows instead.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={save.isPending || !ready}>
              {save.isPending ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
