import type { MeHasPasswordResponse } from "@repo/contracts/types";
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
  Switch,
} from "@repo/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "../../lib/auth";
import { env } from "../../lib/env";
import { Row } from "./row";

/**
 * The password, as one row of the Account panel.
 *
 * It owns its own dialog and its own has-password query, so the panel around it
 * stays a plain list of rows. A social-login account has no password to change,
 * so it is offered a reset email instead of a form it could not submit.
 */
export function PasswordRow() {
  const { data: sessionData } = useSession();
  const [open, setOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [validationError, setValidationError] = useState("");

  const hasPasswordQuery = useQuery({
    queryKey: ["me", "has-password"],
    queryFn: async () => {
      const res = await fetch(`${env.VITE_API_URL}/me/has-password`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check account type");
      return res.json() as Promise<MeHasPasswordResponse>;
    },
  });
  const hasPassword = hasPasswordQuery.data?.hasPassword !== false;

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
      setOpen(false);
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
        redirectTo: "/dashboard/settings?tab=profile",
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

  return (
    <>
      <Row
        label="Password"
        value={hasPassword ? "••••••••" : "Social login — no password set"}
        action={
          hasPassword ? (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Change password
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetEmailMutation.mutate()}
              disabled={resetEmailMutation.isPending}
            >
              {resetEmailMutation.isPending ? "Sending…" : "Send reset email"}
            </Button>
          )
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                Enter your current password, then the new one twice.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {validationError && <p className="text-sm text-destructive">{validationError}</p>}

              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id="revoke-others"
                  checked={revokeOthers}
                  onCheckedChange={setRevokeOthers}
                />
                <Label htmlFor="revoke-others" className="cursor-pointer text-sm font-normal">
                  Sign out all other devices
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Changing…" : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
