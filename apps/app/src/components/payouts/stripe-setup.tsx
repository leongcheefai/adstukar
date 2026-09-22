import { ArrowRight, Bank, GlobeHemisphereWest, Money, StripeLogo } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import { Button } from "@repo/ui";

/** "MY" reads as "Malaysia"; two or more read as a list. */
function countryNames(codes: readonly string[]): string {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  return new Intl.ListFormat("en", { type: "conjunction" }).format(
    codes.map((code) => names.of(code) ?? code),
  );
}

const POINTS = [
  {
    icon: GlobeHemisphereWest,
    text: `For bank accounts in ${countryNames(economy.payout.countries)}`,
  },
  { icon: Bank, text: "Paid directly to your bank" },
  { icon: Money, text: "Your own Stripe account, in your name" },
] as const;

/**
 * The way to a payout account, in the cell the money leaves from. It stands in
 * the place of the cash-out button until the member has somewhere to be paid.
 *
 * The button opens the cash-out panel, which sends the member to Stripe's
 * hosted onboarding (docs/adr/0008). The cell changes to the cash-out button
 * once Stripe says the account may take payouts.
 */
export function StripeSetup({ onSetUp }: { onSetUp: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-center gap-4">
        {/* Stripe's own colour, not a theme token: the tile is their mark, not ours. */}
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#635bff] text-white">
          <StripeLogo size={28} weight="fill" aria-hidden="true" />
        </span>
        <h2 className="min-w-0 text-base font-semibold tracking-tight">
          Set up payouts with Stripe
        </h2>
      </div>

      <ul className="space-y-3 text-sm text-muted-foreground">
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <Icon size={18} aria-hidden="true" className="shrink-0 text-foreground" />
            {text}
          </li>
        ))}
      </ul>

      <Button
        onClick={onSetUp}
        className="bg-[color:var(--on-air)] text-[color:var(--on-air-foreground)] hover:bg-[color:var(--on-air)]/90"
      >
        Set up Stripe
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}
