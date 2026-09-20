import { Outlet, useLocation } from "react-router";
import { CoachProvider } from "../components/coach-provider";
import { useSession } from "../lib/auth";
import { AUTH_PATHS, CapyChannelScreen } from "./capychannel/home";

export function MemberLayout() {
  const { pathname } = useLocation();
  const { data: session } = useSession();
  const dashboardOpen = Boolean(session) && pathname.startsWith("/dashboard");

  return (
    <CoachProvider>
      <div data-vaul-drawer-wrapper="" className="bg-[#08080a]">
        <CapyChannelScreen dashboardOpen={dashboardOpen} />
      </div>
      {/* The dashboard needs a session. The auth paths need none: each is only a
          redirect to `?auth=`, and with no outlet it would never run. */}
      {session || AUTH_PATHS.includes(pathname) ? <Outlet /> : null}
    </CoachProvider>
  );
}
