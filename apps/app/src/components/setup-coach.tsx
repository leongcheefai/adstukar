import { CoachTip } from "./coach-tip";

/**
 * First-run tip after the dashboard drawer opens. It sits next to the first
 * visible Campaigns control — the sidebar on desktop, the overview button on
 * a phone — and names CapyPoints as the other way in.
 */
export function SetupCoach({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  return (
    <CoachTip
      open={open}
      targetPath="/dashboard/campaigns"
      title="List your product here"
      onClose={onDismiss}
    >
      <p>Create a campaign and list your product here.</p>
    </CoachTip>
  );
}
