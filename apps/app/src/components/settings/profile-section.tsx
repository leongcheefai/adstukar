import { Camera, SealCheck } from "@phosphor-icons/react";
import type { PresignAvatarResponse } from "@repo/contracts/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
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
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "../../lib/auth";
import { env } from "../../lib/env";
import { PasswordRow } from "./password-row";
import { Row } from "./row";

export function ProfileSection() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  const [nameOpen, setNameOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [newEmail, setNewEmail] = useState("");

  // useSession resolves after the first render, so the draft follows it until
  // the member types. Reopening the dialog always starts from the saved value.
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const nameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const result = await authClient.updateUser({ name: newName });
      if (result.error) throw new Error(result.error.message ?? "Failed to update name");
    },
    onSuccess: () => {
      toast.success("Name updated");
      setNameOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const emailMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await authClient.changeEmail({
        newEmail: email,
        callbackURL: "/dashboard/settings?tab=profile",
      });
      if (result.error) throw new Error(result.error.message ?? "Failed to send verification");
    },
    onSuccess: () => {
      toast.success("Verification email sent. Check your inbox.");
      setNewEmail("");
      setEmailOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const presignRes = await fetch(`${env.VITE_API_URL}/uploads/avatar/presign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = (await presignRes.json()) as PresignAvatarResponse;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image");

      const result = await authClient.updateUser({ image: publicUrl });
      if (result.error) throw new Error(result.error.message ?? "Failed to update avatar");
    },
    onSuccess: () => toast.success("Picture updated"),
    onError: (err: Error) => toast.error(err.message),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5 MB)");
      return;
    }
    avatarMutation.mutate(file);
    // Reset, so choosing the same file twice still fires a change event.
    e.target.value = "";
  }

  const initials = (user?.name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-lg border">
      {/* The picture leads. It is the only part of this page that is a person
          rather than a field, so it gets the width and the centre line. */}
      <div className="flex flex-col items-center gap-3 border-b px-5 py-8">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarMutation.isPending}
          className="group/pic relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          aria-label="Change your profile picture"
        >
          <Avatar className="size-24">
            <AvatarImage src={user?.image ?? ""} alt="" />
            <AvatarFallback className="text-xl">{initials || "?"}</AvatarFallback>
          </Avatar>
          {/* The scrim only appears on hover, so the picture is a picture first
              and a control second. */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover/pic:opacity-100 group-focus-visible/pic:opacity-100">
            <Camera size={22} className="text-white" />
          </span>
        </button>

        <div className="text-center">
          <p className="text-sm font-medium">{user?.name ?? "—"}</p>
          {/* Only while uploading. The format and size rules are enforced by the
              file input and the guard below, so printing them was noise; a slow
              upload with no sign of life is not. */}
          {avatarMutation.isPending && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="divide-y">
        <Row
          label="Full name"
          value={user?.name || "Not set"}
          action={
            <Button variant="outline" size="sm" onClick={() => setNameOpen(true)}>
              Edit name
            </Button>
          }
        />

        <Row
          label="Email"
          value={
            <span className="flex items-center gap-2">
              <span className="truncate">{user?.email ?? "—"}</span>
              {/* The same blue seal the Listing page puts on a verified
                  campaign, so "verified" looks the same wherever it appears. */}
              {user?.emailVerified && (
                <Badge variant="secondary" className="gap-1">
                  <SealCheck size={12} weight="fill" className="text-primary" />
                  Verified
                </Badge>
              )}
            </span>
          }
          action={
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
              Update email
            </Button>
          }
        />

        <PasswordRow />

        {/* No action: the join date is a fact about the account, not a setting. */}
        <Row
          label="Member since"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
      </div>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nameMutation.mutate(name);
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit name</DialogTitle>
              <DialogDescription>This is the name other members see.</DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={nameMutation.isPending}>
                {nameMutation.isPending ? "Saving…" : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              emailMutation.mutate(newEmail);
            }}
          >
            <DialogHeader>
              <DialogTitle>Update email</DialogTitle>
              <DialogDescription>
                Enter your new address. We send a link there, and the change lands only after you
                open it.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-1.5">
              <Label htmlFor="profile-new-email">New email</Label>
              <Input
                id="profile-new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={emailMutation.isPending}>
                {emailMutation.isPending ? "Sending…" : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
