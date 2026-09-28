import { useNetworkStats } from "../../lib/stats";
import { AccountMenu } from "./account-menu";

export function TvBar({
  menuOpen,
  onMenuOpenChange,
  onBack,
  hint = false,
  dot = false,
}: {
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onBack: () => void;
  hint?: boolean;
  /** Red dot on the account: the dashboard has never been opened. */
  dot?: boolean;
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
        {online !== undefined && (
          <p className="tv-live">
            <i className="tv-live-dot" aria-hidden />
            <b>{online.toLocaleString("en-US")}</b> {online === 1 ? "screen" : "screens"} online
          </p>
        )}
        <AccountMenu open={menuOpen} onOpenChange={onMenuOpenChange} hint={hint} dot={dot} />
      </div>
    </div>
  );
}
