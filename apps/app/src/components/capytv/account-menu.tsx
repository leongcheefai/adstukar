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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const name = session?.user.name ?? "Account";

  async function logout() {
    onOpenChange(false);
    clearResume();
    await signOutThen(() => navigate("/", { replace: true }));
  }

  return (
    <div className="tv-account" data-signed-in="">
      <button
        className="tv-account-btn"
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Your account"
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
      >
        <span className="tv-avatar" aria-hidden>
          {initials(name)}
        </span>
      </button>
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
