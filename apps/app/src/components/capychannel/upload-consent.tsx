import { project } from "@repo/config/project";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@repo/ui";
import { useState } from "react";
import { env } from "../../lib/env";
import { IMAGE_LIMIT, VIDEO_LIMIT } from "../../lib/library";

/**
 * Asked once per member, before the first file picker opens. Nothing goes to
 * the server until they agree: the picker does not open, so no file is chosen.
 */
export function UploadConsentDialog({
  open,
  onOpenChange,
  onAgree,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}) {
  const [agreed, setAgreed] = useState(false);

  function change(next: boolean) {
    if (!next) setAgreed(false);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your files go to our server</DialogTitle>
          <DialogDescription>
            When you add a picture or a clip, {project.name} uploads it to {project.name} storage so
            your set can play it. Anyone with the link can view the file.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              Image
            </span>
            <span>{IMAGE_LIMIT}.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              Video
            </span>
            <span>{VIDEO_LIMIT}.</span>
          </li>
        </ul>
        <div className="flex items-start gap-3">
          <Checkbox
            id="upload-consent"
            checked={agreed}
            onCheckedChange={(value) => setAgreed(value === true)}
            className="mt-0.5"
          />
          <Label htmlFor="upload-consent" className="text-sm font-normal leading-snug">
            I have the right to show these files, and I agree to the{" "}
            <a
              className="font-medium text-primary underline underline-offset-2"
              href={`${env.VITE_WEB_URL}/terms`}
              target="_blank"
              rel="noreferrer"
            >
              Terms of Service
            </a>{" "}
            and the{" "}
            <a
              className="font-medium text-primary underline underline-offset-2"
              href={`${env.VITE_WEB_URL}/ads-policy`}
              target="_blank"
              rel="noreferrer"
            >
              Ads Policy
            </a>
            .
          </Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => change(false)}>
            Not now
          </Button>
          <Button type="button" disabled={!agreed} onClick={onAgree}>
            Agree and choose files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
