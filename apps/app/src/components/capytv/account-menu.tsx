import { project } from "@repo/config/project";
import { useId } from "react";
import { useNavigate } from "react-router";
import { signOutThen, useSession } from "../../lib/auth";
import { clearResume } from "./resume";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export function AccountMenu({
  open,
  onOpenChange,
  hint = false,
  dot = false,
  onHintClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** First-run tip pointing at this control. Hidden while the menu is open. */
  hint?: boolean;
  /** Red dot on the picture and on the Dashboard entry: never opened yet. */
  dot?: boolean;
  /** The close button on the tip. */
  onHintClose?: () => void;
}) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const name = session?.user.name ?? "Account";
  const image = session?.user.image;
  const tipId = useId();
  const showHint = hint && !open;

  async function logout() {
    onOpenChange(false);
    clearResume();
    await signOutThen(() => navigate("/", { replace: true }));
  }

  return (
    <div className="tv-account" data-signed-in="" data-coach={showHint ? "" : undefined}>
      <button
        className="tv-account-btn"
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Your account"
        aria-describedby={showHint ? tipId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
      >
        <span className="tv-avatar" aria-hidden>
          {initials(name)}
          {image ? <img src={image} alt="" /> : null}
        </span>
        {dot ? (
          <span className="tv-dot tv-dot-avatar">
            <span className="sr-only">Dashboard not yet opened</span>
          </span>
        ) : null}
      </button>
      {showHint ? (
        <div className="tv-coach" id={tipId} aria-live="polite">
          <div className="tv-coach-head">
            <p className="tv-coach-title">Welcome to {project.name}</p>
            <button
              type="button"
              className="tv-coach-close"
              aria-label="Close tip"
              onClick={(event) => {
                event.stopPropagation();
                onHintClose?.();
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p>Your dashboard is here. Start a listing, or connect your Stripe to earn money.</p>
        </div>
      ) : null}
      <div className="tv-account-menu" hidden={!open}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(false);
            navigate("/dashboard");
          }}
        >
          Dashboard
          {dot ? <span className="tv-dot" aria-hidden /> : null}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void logout();
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
