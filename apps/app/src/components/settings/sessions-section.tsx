import { Badge, Button } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient, useSession } from "../../lib/auth";

type SessionItem = {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  updatedAt: Date | string;
};

export function SessionsSection() {
  const { data: sessionData } = useSession();
  const currentToken = sessionData?.session.token;
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const result = await authClient.listSessions();
      return (result.data ?? []) as SessionItem[];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const result = await authClient.revokeSession({ token });
      if (result.error) throw new Error(result.error.message ?? "Failed to revoke session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session revoked");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.revokeOtherSessions();
      if (result.error)
        throw new Error(result.error.message ?? "Failed to sign out other sessions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Other sessions signed out");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={sessions.length <= 1 || revokeOthersMutation.isPending}
          onClick={() => revokeOthersMutation.mutate()}
        >
          {revokeOthersMutation.isPending ? "Signing out…" : "Sign out other devices"}
        </Button>
      </div>

      {sessionsQuery.isPending && (
        <p className="text-sm text-muted-foreground">Loading sessions…</p>
      )}
      {sessionsQuery.isError && <p className="text-sm text-destructive">Failed to load sessions</p>}
      {sessions.map((session) => {
        const isCurrent = session.token === currentToken;
        const userAgentDisplay = (session.userAgent ?? "Unknown device").slice(0, 60);
        const lastActive = new Date(session.updatedAt).toLocaleDateString();

        return (
          <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{userAgentDisplay}</p>
                {isCurrent && <Badge variant="secondary">Current</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress ?? "Unknown IP"} · Last active {lastActive}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isCurrent || revokeMutation.isPending}
              onClick={() => revokeMutation.mutate(session.token)}
            >
              Revoke
            </Button>
          </div>
        );
      })}
    </div>
  );
}
