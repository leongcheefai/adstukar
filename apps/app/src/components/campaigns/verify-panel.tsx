import { ShieldCheck } from "@phosphor-icons/react";
import type { Campaign } from "@repo/contracts/types";
import { Button } from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useVerifyCampaign } from "../../lib/campaigns";
import { CopyButton } from "../copy-button";

/**
 * The domain-verification body. It is shared, so the step inside the listing
 * dialog and the standalone dialog can never drift apart.
 *
 * The token belongs to the campaign, not to any one listing: one domain, one
 * proof, however many creatives run on it.
 */
export function VerifyPanel({
  campaign,
  onDone,
  doneLabel = "Close",
}: {
  campaign: Campaign;
  onDone: () => void;
  doneLabel?: string;
}) {
  const verify = useVerifyCampaign();
  const [message, setMessage] = useState<string | null>(null);

  const token = `adstukar-verify=${campaign.verificationToken}`;
  const wellKnown = `https://${campaign.domain}/.well-known/adstukar.txt`;

  async function run() {
    setMessage(null);
    try {
      const result = await verify.mutateAsync(campaign.id);
      setMessage(result.message);
      if (result.verified) {
        toast.success("Domain verified");
        onDone();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Prove you control <span className="font-mono text-foreground">{campaign.domain}</span> with
        either method, then check it.
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium">Your token</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 font-mono text-xs">
            {token}
          </code>
          <CopyButton value={token} size="icon" label="Copy token" />
        </div>
      </div>

      <ol className="space-y-4 text-sm">
        <li className="space-y-1">
          <p className="font-medium">Option A — well-known file</p>
          <p className="text-muted-foreground">
            Serve a plain-text file containing the token at{" "}
            <code className="font-mono text-xs">{wellKnown}</code>.
          </p>
        </li>
        <li className="space-y-1">
          <p className="font-medium">Option B — DNS TXT record</p>
          <p className="text-muted-foreground">
            Add a TXT record on <code className="font-mono text-xs">{campaign.domain}</code> with
            the token as its value. DNS changes can take a few minutes.
          </p>
        </li>
      </ol>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          {doneLabel}
        </Button>
        <Button type="button" onClick={run} disabled={verify.isPending}>
          <ShieldCheck size={14} />
          {verify.isPending ? "Checking…" : "Verify"}
        </Button>
      </div>
    </div>
  );
}
