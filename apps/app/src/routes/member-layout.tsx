import { Outlet } from "react-router";
import { CoachProvider } from "../components/coach-provider";
import { CapyChannelScreen } from "./capychannel/home";

/** The set. A session sees the channels; no session sees the login form. */
export function MemberLayout() {
  return (
    <CoachProvider>
      <div className="bg-[#08080a]">
        <CapyChannelScreen />
      </div>
      {/* `/login`, `/signup` and `/forgot-password`: each only redirects to `?auth=`. */}
      <Outlet />
    </CoachProvider>
  );
}
