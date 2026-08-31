import type { MeHasPasswordResponse } from "@repo/contracts/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@repo/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "../../lib/auth";
import { env } from "../../lib/env";

export function SecuritySection() {
  const { data: sessionData } = useSession();

  const hasPasswordQuery = useQuery({
    queryKey: ["me", "has-password"],
    queryFn: async () => {
      const res = await fetch(`${env.VITE_API_URL}/me/has-password`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check account type");
      return res.json() as Promise<MeHasPasswordResponse>;
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [validationError, setValidationError] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      });
      if (result.error) throw new Error(result.error.message ?? "Failed to change password");
    },
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setRevokeOthers(false);
      setValidationError("");
    },
    onError: (err: Error) => {
      const msg = err.message.toLowerCase();
      if (msg.includes("invalid_password") || msg.includes("incorrect")) {
        toast.error("Current password is incorrect");
      } else {
        toast.error(err.message);
      }
    },
  });

  const resetEmailMutation = useMutation({
    mutationFn: async () => {
      const email = sessionData?.user.email;
      if (!email) throw new Error("No email found");
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/dashboard/settings?tab=security",
      });
      if (result.error) throw new Error(result.error.message ?? "Failed to send reset email");
    },
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }
    if (newPassword === currentPassword) {
      setValidationError("New password must be different");
      return;
    }

    changePasswordMutation.mutate();
  }

  if (hasPasswordQuery.data?.hasPassword === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account uses social login. Set a password first by requesting a password reset.
          </p>
          <Button
            variant="outline"
            onClick={() => resetEmailMutation.mutate()}
            disabled={resetEmailMutation.isPending}
          >
            {resetEmailMutation.isPending ? "Sending…" : "Send password reset email"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>

          {validationError && <p className="text-sm text-destructive">{validationError}</p>}

          <div className="flex items-center gap-3">
            <Switch id="revoke-others" checked={revokeOthers} onCheckedChange={setRevokeOthers} />
            <Label htmlFor="revoke-others" className="cursor-pointer">
              Sign out all other devices after changing password
            </Label>
          </div>

          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
