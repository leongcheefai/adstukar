import type { PresignAvatarResponse } from "@repo/contracts/types";
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Label, Separator } from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "../../lib/auth";
import { env } from "../../lib/env";

export function ProfileSection() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  // Name subform
  const [name, setName] = useState(user?.name ?? "");

  // Sync name from session once it loads (useSession is async)
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const nameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const result = await authClient.updateUser({ name: newName });
      if (result.error) throw new Error(result.error.message ?? "Failed to update name");
    },
    onSuccess: () => toast.success("Name updated"),
    onError: (err: Error) => toast.error(err.message),
  });

  // Email subform
  const [newEmail, setNewEmail] = useState("");
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
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Avatar subform
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Presign
      const presignRes = await fetch(`${env.VITE_API_URL}/uploads/avatar/presign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = (await presignRes.json()) as PresignAvatarResponse;

      // Step 2: Upload
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image");

      // Step 3: Update user
      const result = await authClient.updateUser({ image: publicUrl });
      if (result.error) throw new Error(result.error.message ?? "Failed to update avatar");
    },
    onSuccess: () => toast.success("Avatar updated"),
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
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  const initials = (user?.name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Name subform */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          nameMutation.mutate(name);
        }}
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Display name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <Button type="submit" disabled={nameMutation.isPending}>
          {nameMutation.isPending ? "Saving…" : "Save name"}
        </Button>
      </form>

      <Separator />

      {/* Email subform */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="profile-current-email">Current email</Label>
          <Input id="profile-current-email" value={user?.email ?? ""} disabled readOnly />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            emailMutation.mutate(newEmail);
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
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
          <Button type="submit" disabled={emailMutation.isPending}>
            {emailMutation.isPending ? "Sending…" : "Send verification"}
          </Button>
        </form>
      </div>

      <Separator />

      {/* Avatar subform */}
      <div className="space-y-3">
        <Label>Profile picture</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              disabled={avatarMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarMutation.isPending ? "Uploading…" : "Change avatar"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPEG or WebP — max 5 MB</p>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
