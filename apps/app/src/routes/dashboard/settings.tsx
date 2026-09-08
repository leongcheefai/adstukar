import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@repo/ui";
import { useSearchParams } from "react-router";
import { DangerSection } from "../../components/settings/danger-section";
import { ModerationSection } from "../../components/settings/moderation-section";
import { PayoutsSection } from "../../components/settings/payouts-section";
import { ProfileSection } from "../../components/settings/profile-section";
import { ReleasesSection } from "../../components/settings/releases-section";
import { SessionsSection } from "../../components/settings/sessions-section";
import { useSession } from "../../lib/auth";

interface SettingsSection {
  id: string;
  label: string;
  title: string;
  description: string;
  destructive?: boolean;
  /** Starts a labelled block in the left panel. */
  group?: string;
}

const SECTIONS: SettingsSection[] = [
  {
    // The id stays "profile" so saved ?tab=profile links keep working. An
    // unknown tab — ?tab=security from an old link — falls back to this one,
    // which is where the password lives now.
    id: "profile",
    label: "Account",
    title: "Account",
    description: "Your name, email, password, and profile picture.",
  },
  {
    id: "sessions",
    label: "Sessions",
    title: "Active sessions",
    description: "Devices signed in to your account. Revoke any you do not recognise.",
  },
  {
    id: "danger",
    label: "Danger zone",
    title: "Danger zone",
    description: "Irreversible actions that permanently affect your account.",
    destructive: true,
  },
];

/** Only reachable for `role === "admin"`; the API enforces the same rule. */
const ADMIN_SECTIONS: SettingsSection[] = [
  {
    id: "moderation",
    label: "Moderation",
    title: "Moderation",
    description:
      "Listings and devices waiting for review, oldest first. A first approved listing grants the welcome CapyPoints.",
    group: "Admin",
  },
  {
    id: "payouts",
    label: "Payouts",
    title: "Payouts",
    description:
      "Distributors waiting to cash out, oldest first. Read the history behind each one, send the money by hand, then record the reference.",
  },
  {
    id: "releases",
    label: "Releases",
    title: "Releases",
    description: "GitHub releases synced to the database.",
  },
];

function SectionBody({ id }: { id: string }) {
  switch (id) {
    case "moderation":
      return <ModerationSection />;
    case "payouts":
      return <PayoutsSection />;
    case "releases":
      return <ReleasesSection />;
    case "sessions":
      return <SessionsSection />;
    case "danger":
      return <DangerSection />;
    default:
      return <ProfileSection />;
  }
}

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "admin";

  const sections = isAdmin ? [...SECTIONS, ...ADMIN_SECTIONS] : SECTIONS;
  const raw = params.get("tab");
  const active = sections.find((section) => section.id === raw) ?? sections[0];

  function setTab(value: string) {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  }

  return (
    // Cancels the main padding so both panels reach the page edges.
    <div className="-m-6 flex min-h-full flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">
      <aside className="shrink-0 border-b md:w-72 md:overflow-y-auto md:border-r md:border-b-0">
        <h1 className="px-6 pt-6 pb-4 text-xl font-semibold tracking-tight">Settings</h1>
        <nav className="pb-4">
          {sections.map((section) => {
            const isActive = section.id === active.id;
            return (
              <div key={section.id}>
                {section.group && (
                  <p className="mt-4 border-t px-6 pt-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {section.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setTab(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 border-r-2 px-6 py-3 text-left text-sm transition-colors",
                    isActive
                      ? "border-primary bg-accent font-medium text-accent-foreground"
                      : "border-transparent hover:bg-accent/50 hover:text-foreground",
                    !isActive && section.destructive && "text-destructive",
                    !isActive && !section.destructive && "text-muted-foreground",
                  )}
                >
                  <span className="flex-1">{section.label}</span>
                  <CaretRight size={16} className="shrink-0 opacity-60" />
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
        <header className="max-w-2xl">
          <h2
            className={cn(
              "text-xl font-semibold tracking-tight",
              active.destructive && "text-destructive",
            )}
          >
            {active.title}
          </h2>
        </header>

        <div className="mt-6 max-w-2xl">
          <SectionBody id={active.id} />
        </div>
      </section>
    </div>
  );
}
