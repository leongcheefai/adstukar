import { project } from "@repo/config/project";
import { CoachTip } from "./coach-tip";

/** Where the tip sends people. The ledger page opens the buy panel on this flag. */
export const STRIPE_SETUP_PATH = "/dashboard/ledger?buy=1";

/**
 * First-run tip for Stripe. Money enters the product through a top-up, and
 * Stripe takes the card, so "set up Stripe" means buying the first pack. The
 * tip points at the CapyPoints control and hands off to the buy panel.
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
      targetPath="/dashboard/ledger"
      title={`${project.pointsName} system`}
      onOutside={onIgnore}
      onClose={onIgnore}
    >
      <p>
        Top-up, Earn and Cashout {project.pointsName} here. You must connect your Stripe to cashout{" "}
        {project.pointsName}
      </p>
    </CoachTip>
  );
}
