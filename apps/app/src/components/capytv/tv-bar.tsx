import { useEffect, useState } from "react";
import { AccountMenu } from "./account-menu";

const LIVE_MS = 2600;

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
  const [online, setOnline] = useState(1284);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      setOnline((n) => Math.min(9999, Math.max(1000, n + Math.round((Math.random() - 0.5) * 18))));
    }, LIVE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tv-bar">
      <button className="tv-back" type="button" onClick={onBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.4 5.6 8 12l6.4 6.4" />
        </svg>
        Back
      </button>
      <div className="tv-right">
        <p className="tv-live">
          <i className="tv-live-dot" aria-hidden />
          <b>{online.toLocaleString("en-US")}</b> online
        </p>
        <AccountMenu open={menuOpen} onOpenChange={onMenuOpenChange} hint={hint} dot={dot} />
      </div>
    </div>
  );
}
