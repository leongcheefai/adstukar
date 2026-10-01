import type { ScreenStatus } from "../../lib/screen/use-screen";
import { useNetworkStats } from "../../lib/stats";
import { AccountMenu } from "./account-menu";

/** The words for where this set's review stands. A set with no key shows none. */
const CHIP: Partial<Record<ScreenStatus, string>> = {
  pending: "Waiting for approval",
  rejected: "Not approved",
  earning: "Earning",
  elsewhere: "Earning in another tab",
};

export function TvBar({
  menuOpen,
  onMenuOpenChange,
  onBack,
  hint = false,
  dot = false,
  status,
  pending,
  rejectionReason,
  onRegister,
  onSignIn,
}: {
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onBack: () => void;
  hint?: boolean;
  /** Red dot on the account: the dashboard has never been opened. */
  dot?: boolean;
  status: ScreenStatus;
  /** Reports the set still owes. */
  pending: number;
  rejectionReason: string | null;
  onRegister?: () => void;
  onSignIn?: () => void;
}) {
  // Approved screens that reported in the last few minutes. Hidden until the
  // first answer lands, so the bar never prints a number it made up.
  const online = useNetworkStats().data?.screensOnline;

  return (
    <div className="tv-bar">
      <button className="tv-back" type="button" onClick={onBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.4 5.6 8 12l6.4 6.4" />
        </svg>
        Back
      </button>
      <div className="tv-right">
        {status === "offline" ? (
          <p className="tv-screen-chip" data-status={status}>
            Offline · {pending.toLocaleString("en-US")} {pending === 1 ? "play" : "plays"} to send
          </p>
        ) : CHIP[status] ? (
          <p
            className="tv-screen-chip"
            data-status={status}
            title={status === "rejected" ? (rejectionReason ?? undefined) : undefined}
          >
            {CHIP[status]}
            {status === "rejected" && rejectionReason ? `: ${rejectionReason}` : null}
          </p>
        ) : null}
        {online !== undefined && (
          <p className="tv-live">
            <i className="tv-live-dot" aria-hidden />
            <b>{online.toLocaleString("en-US")}</b> {online === 1 ? "screen" : "screens"} online
          </p>
        )}
        <AccountMenu
          open={menuOpen}
          onOpenChange={onMenuOpenChange}
          hint={hint}
          dot={dot}
          onRegister={onRegister}
          onSignIn={onSignIn}
        />
      </div>
    </div>
  );
}
