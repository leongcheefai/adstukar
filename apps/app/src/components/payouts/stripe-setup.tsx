import { ArrowRight, Bank, GlobeHemisphereWest, Money, StripeLogo } from "@phosphor-icons/react";
import { project } from "@repo/config/project";
import { Button } from "@repo/ui";

const POINTS = [
  { icon: GlobeHemisphereWest, text: "Support for 34 countries" },
  { icon: Bank, text: "Paid directly to your bank" },
  { icon: Money, text: `Stripe payout fees covered by ${project.name}` },
] as const;

/**
 * The way to a payout account, in the cell the money leaves from. It stands in
 * the place of the cash-out button until the member has somewhere to be paid.
 *
 * Design only for now. The API has no Stripe Connect route, and a payout is
 * still paid by hand (docs/adr/0005). So "connected" reads the payout account
 * on file, and the button opens the dialog that takes those details.
 */
export function StripeSetup({ onSetUp, disabled }: { onSetUp: () => void; disabled: boolean }) {
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
        disabled={disabled}
        className="bg-[color:var(--on-air)] text-[color:var(--on-air-foreground)] hover:bg-[color:var(--on-air)]/90"
      >
        Set up Stripe
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}
