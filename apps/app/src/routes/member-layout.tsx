import { Outlet, useLocation } from "react-router";
import { useSession } from "../lib/auth";
import { CapyTvScreen } from "./capytv/home";

export function MemberLayout() {
  const { pathname } = useLocation();
  const { data: session } = useSession();
  const dashboardOpen = Boolean(session) && pathname.startsWith("/dashboard");

  return (
    <>
      <div data-vaul-drawer-wrapper="" className="bg-[#08080a]">
        <CapyTvScreen dashboardOpen={dashboardOpen} />
      </div>
      {session ? <Outlet /> : null}
    </>
  );
}
