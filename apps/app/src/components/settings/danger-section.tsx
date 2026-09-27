import { project } from "@repo/config/project";
import type { MeClosureResponse, MeHasPasswordResponse } from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
} from "@repo/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authClient, signOut } from "../../lib/auth";
import { env } from "../../lib/env";

export function DangerSection() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const hasPasswordQuery = useQuery({
    queryKey: ["me", "has-password"],
    queryFn: async () => {
      const res = await fetch(`${env.VITE_API_URL}/me/has-password`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check account type");
      return res.json() as Promise<MeHasPasswordResponse>;
    },
  });

  // An account that moved money or played closes through support, never here:
  // the ledger keeps its rows. The API refuses the delete too; this only says so first.
  const closureQuery = useQuery({
    queryKey: ["me", "closure"],
    queryFn: async () => {
      const res = await fetch(`${env.VITE_API_URL}/me/closure`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check account");
      return res.json() as Promise<MeClosureResponse>;
    },
  });
  const closable = closureQuery.data?.closable === true;

  const deleteMutation = useMutation({
    mutationFn: async (args: { password?: string; callbackURL?: string }) => {
      const result = await authClient.deleteUser(args);
      if (result.error) throw new Error(result.error.message ?? "Failed to delete account");
      return result.data;
    },
    onSuccess: async (data) => {
      setOpen(false);
      // With a verification sender set, even a correct password only sends the
      // email; the account goes when the member opens the link.
      if (data?.message === "User deleted") {
        await signOut();
        navigate("/login");
      } else {
        toast.success("Confirmation email sent");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleDelete() {
    // The emailed link opens on the API, so the way back must name the app's origin.
    const callbackURL = `${window.location.origin}/login`;
    if (hasPasswordQuery.data?.hasPassword) {
      await deleteMutation.mutateAsync({ password, callbackURL });
    } else {
      await deleteMutation.mutateAsync({ callbackURL });
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
      <div>
        <p className="text-sm font-medium">Delete account</p>
        <p className="text-xs text-muted-foreground">
          {closureQuery.data && !closable
            ? `Your account has money or play history, so it cannot be deleted here. Email ${project.email.support} to close it.`
            : "Permanently delete your account and your profile."}
        </p>
      </div>
      <Button variant="destructive" onClick={() => setOpen(true)} disabled={!closable}>
        Delete account
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setPassword("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. Your account, campaigns and screens will be deleted and
              cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasPasswordQuery.data?.hasPassword ? (
            <div className="space-y-1.5">
              <Label htmlFor="delete-password">Confirm your password</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your current password"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              We will email you a link to confirm account deletion.
            </p>
          )}
          {hasPasswordQuery.data?.hasPassword && (
            <p className="text-sm text-muted-foreground">
              We will then email you a link to confirm.
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                (hasPasswordQuery.data?.hasPassword === true && !password)
              }
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
