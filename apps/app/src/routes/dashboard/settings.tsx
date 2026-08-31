import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { useSearchParams } from "react-router";
import { DangerSection } from "../../components/settings/danger-section";
import { ProfileSection } from "../../components/settings/profile-section";
import { SecuritySection } from "../../components/settings/security-section";
import { SessionsSection } from "../../components/settings/sessions-section";

const TABS = ["profile", "security", "sessions", "danger"] as const;
type Tab = (typeof TABS)[number];

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "profile";

  const setTab = (value: string) => {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsSection />
        </TabsContent>
        <TabsContent value="danger">
          <DangerSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
