import { Button } from "@repo/ui";
import { Zap } from "lucide-react";
import { Link } from "react-router";
import { useSubscription } from "../lib/billing";

export function UpgradeCard() {
  const { isPro, isLoading } = useSubscription();
  if (isLoading || isPro) return null;

  return (
    <div className="rounded-lg bg-primary p-3 text-primary-foreground">
      <div className="mb-2 flex size-7 items-center justify-center rounded-full bg-primary-foreground/15">
        <Zap className="size-4" />
      </div>
      <p className="text-sm font-semibold">Upgrade to Pro</p>
      <p className="mt-0.5 text-xs text-primary-foreground/80">
        Unlock advanced features and unlimited usage.
      </p>
      <Button
        asChild
        size="sm"
        className="mt-3 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
      >
        <Link to="/dashboard/billing">Upgrade now</Link>
      </Button>
    </div>
  );
}
