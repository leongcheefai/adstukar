import { Coins } from "@phosphor-icons/react";
import { Button } from "@repo/ui";

/**
 * The way to a payout account, in the cell the money leaves from. It stands in
 * the place of the cash-out button until the member has somewhere to be paid.
 *
 * Payout setup is not open to members yet, so the button is disabled and opens
 * nothing. When it opens, the button starts Stripe's hosted onboarding
 * (docs/adr/0008). The cell changes to the cash-out button once Stripe says the
 * account may take payouts.
 */
export function StripeSetup() {
  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-center gap-4">
        {/* The wallet's own mark on the brand blue, not Stripe's: the card names
            no processor while the setup is not open. */}
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Coins size={28} weight="fill" aria-hidden="true" />
        </span>
        <h2 className="min-w-0 text-base font-semibold tracking-tight">Set up payouts</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        We are working hard to set up this feature for you.
      </p>

      <Button
        disabled
        className="bg-[color:var(--on-air)] text-[color:var(--on-air-foreground)] hover:bg-[color:var(--on-air)]/90"
      >
        Coming Soon
      </Button>
    </div>
  );
}
