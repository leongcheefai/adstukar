import { CircleNotch, Trash, UploadSimple } from "@phosphor-icons/react";
import { media, megabytes } from "@repo/config/media";
import { Button } from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadLogo } from "../../lib/campaigns";

/** What the presign route and the copy below both accept. */
const LOGO_TYPES = media.image.types.join(",");
const LOGO_MAX_BYTES = media.image.maxBytes;
const LOGO_MAX_LABEL = megabytes(LOGO_MAX_BYTES);

interface LogoPickerProps {
  /** The id the field's label points at. */
  id: string;
  /** The stored logo's public URL, or "" for none. */
  value: string;
  onChange: (url: string) => void;
}

/**
 * The one logo on a creative. A drop puts the file in storage and hands back
 * its public URL; a site check may fill the field with an icon the site
 * serves, and the member replaces or removes it here the same way.
 */
export function LogoPicker({ id, value, onChange }: LogoPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const upload = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (publicUrl) => onChange(publicUrl),
    onError: (err: Error) => toast.error(err.message),
  });

  function take(file: File) {
    if (!LOGO_TYPES.split(",").includes(file.type)) {
      toast.error("Use a PNG, JPEG or WebP image");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error(`That image is over ${LOGO_MAX_LABEL}`);
      return;
    }
    upload.mutate(file);
  }

  return (
    <>
      <input
        ref={fileRef}
        id={id}
        type="file"
        accept={LOGO_TYPES}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) take(file);
          // Cleared so picking the same file twice still fires a change.
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <img src={value} alt="" className="size-12 shrink-0 rounded-md border object-cover" />
          <span className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove the logo"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash size={16} />
          </Button>
        </div>
      ) : (
        /* A whole area, not a button beside a field: the target is the
           drop zone, so pointing at it and dropping on it agree. */
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) take(file);
          }}
          disabled={upload.isPending}
          className={`flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:pointer-events-none ${
            dragging ? "border-primary bg-accent" : "border-border"
          }`}
        >
          {upload.isPending ? (
            <CircleNotch size={20} className="shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <UploadSimple size={20} className="shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {upload.isPending ? "Uploading…" : "Drop a logo, or click to choose"}
            </span>
            <span className="block text-xs text-muted-foreground">
              Optional. PNG, JPEG or WebP up to {LOGO_MAX_LABEL}. It must read on black.
            </span>
          </span>
        </button>
      )}
    </>
  );
}
