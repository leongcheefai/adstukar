import { CoachTip } from "./coach-tip";

/** Where the tip sends people. The ledger page opens the buy panel on this flag. */
export const STRIPE_SETUP_PATH = "/dashboard/wallet?buy=1";

/**
 * First-run tip for Stripe. Money enters the product through a top-up, and
 * Stripe takes the card, so "set up Stripe" means the first top-up. The
 * tip points at the Wallet control and hands off to the top-up panel.
 *
 * Got it, a click elsewhere, and Escape are all an ignore: the tip goes and a
 * red dot stays on the control until it is clicked. Only the control itself
 * takes the step.
 */
export function StripeCoach({
  open,
  onIgnore,
}: {
  open: boolean;
  onIgnore: () => void;
}) {
  return (
    <CoachTip
      open={open}
      targetPath="/dashboard/wallet"
      title="Your wallet"
      onOutside={onIgnore}
      onClose={onIgnore}
    >
      <p>Add funds, earn and cash out here. You must connect your Stripe to cash out.</p>
    </CoachTip>
  );
}
