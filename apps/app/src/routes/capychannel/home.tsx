import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { AccountMenu } from "../../components/capychannel/account-menu";
import { Boot, type BootPhase } from "../../components/capychannel/boot";
import { BootAuth } from "../../components/capychannel/boot-auth";
import { ChannelPicker } from "../../components/capychannel/channel-picker";
import type { ChannelPick } from "../../components/capychannel/channels/catalog";
import { ChannelLayer } from "../../components/capychannel/channels/layer";
import { Ticker } from "../../components/capychannel/ticker";
import { TvBar } from "../../components/capychannel/tv-bar";
import { useSession } from "../../lib/auth";
import { useCoach } from "../../lib/coach";
import { landingUrl } from "../../lib/landing";
import "../../styles/capychannel.css";

const BAR_IDLE_MS = 3500;
const BOOT_FADE_MS = 600;

function brandHoldMs(): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 2500;
}

/** The paths the router turns into `?auth=`. Each one is a request for the form. */
export const AUTH_PATHS = ["/login", "/signup", "/forgot-password"];

export function CapyChannelScreen({ dashboardOpen = false }: { dashboardOpen?: boolean }) {
  const { data: session, isPending, error } = useSession();
  const { source: sourceHint, opened, dismiss } = useCoach();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const signedIn = Boolean(session);
  // No session and no request for the form: the visitor belongs on the landing
  // page. `?auth=` is how the landing page's own buttons ask for the form, so
  // it is the one way in. A failed check is not an answer, and the form stays:
  // a dead API must not bounce a member off their own set.
  //
  // `/login`, `/signup` and `/forgot-password` ask for the form too. The router
  // turns each into `?auth=`, but only in an effect, and the session check can
  // already read "no session" in that same commit. Without the path check the
  // redirect below wins the race and the landing page's own button bounces.
  //
  // With no landing page to go to, the form stays on the set instead.
  const asksForForm = params.has("auth") || AUTH_PATHS.includes(pathname);
  const landing = landingUrl();
  const leaving = !isPending && !signedIn && !error && !asksForForm && landing !== null;

  const [phase, setPhase] = useState<BootPhase>("brand");
  const [brandHeld, setBrandHeld] = useState(false);
  const [again, setAgain] = useState(false);
  const [channel, setChannel] = useState<ChannelPick | null>(null);
  const [bootDone, setBootDone] = useState(false);
  const [bootHidden, setBootHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintReady, setHintReady] = useState(false);
  const picked = useRef(false);
  const hadSession = useRef(false);

  const playing = channel !== null && bootDone;
  const onChooser = signedIn && phase === "pick" && !playing && !dashboardOpen;
  const showHint = sourceHint && hintReady && !dashboardOpen;
  // A red dot on the account until the dashboard has been opened once. Not
  // while the tip is up: the tip already points at the same control.
  const showDot = !opened && !showHint && !dashboardOpen;

  useEffect(() => {
    if (!leaving || !landing) return;
    // `from=app` tells the landing page not to check the session again. Two
    // origins that disagree about one cookie would otherwise trade the visitor
    // back and forth for ever.
    window.location.replace(landing);
  }, [leaving, landing]);

  useEffect(() => {
    if (phase !== "brand") return;
    const id = window.setTimeout(() => setBrandHeld(true), brandHoldMs());
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (!brandHeld || isPending) return;
    setPhase("pick");
  }, [brandHeld, isPending]);

  useEffect(() => {
    if (signedIn) hadSession.current = true;
  }, [signedIn]);

  useEffect(() => {
    if (isPending || signedIn) return;
    picked.current = false;
    setChannel(null);
    setBootDone(false);
    setBootHidden(false);
    setMenuOpen(false);
    setIdle(false);
    if (hadSession.current) {
      setAgain(true);
      setPhase("pick");
      hadSession.current = false;
    }
  }, [isPending, signedIn]);

  useEffect(() => {
    if (!bootDone) return;
    const id = window.setTimeout(() => setBootHidden(true), BOOT_FADE_MS);
    return () => window.clearTimeout(id);
  }, [bootDone]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (dashboardOpen) setMenuOpen(false);
  }, [dashboardOpen]);

  useEffect(() => {
    if (dashboardOpen) {
      dismiss("source");
      dismiss("opened");
    }
  }, [dashboardOpen, dismiss]);

  useEffect(() => {
    if (!signedIn || !sourceHint || dashboardOpen || (phase !== "pick" && !playing)) {
      setHintReady(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setHintReady(true), reduce || again ? 200 : 700);
    return () => window.clearTimeout(id);
  }, [signedIn, sourceHint, dashboardOpen, phase, playing, again]);

  useEffect(() => {
    if (!playing || menuOpen || dashboardOpen || showHint) {
      setIdle(false);
      return;
    }
    let timer = window.setTimeout(() => setIdle(true), BAR_IDLE_MS);
    function wake() {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), BAR_IDLE_MS);
    }
    const opts: AddEventListenerOptions = { passive: true };
    for (const type of ["mousemove", "mousedown", "keydown", "touchstart"] as const) {
      document.addEventListener(type, wake, opts);
    }
    return () => {
      window.clearTimeout(timer);
      for (const type of ["mousemove", "mousedown", "keydown", "touchstart"] as const) {
        document.removeEventListener(type, wake);
      }
    };
  }, [playing, menuOpen, dashboardOpen, showHint]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (dashboardOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)
      ) {
        return;
      }
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (!playing) return;
      back();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playing, menuOpen, dashboardOpen]);

  function setAccountMenu(open: boolean) {
    setMenuOpen(open);
    if (open) dismiss("source");
  }

  function pick(next: ChannelPick) {
    if (!signedIn || picked.current) return;
    picked.current = true;
    setChannel(next);
    setBootDone(true);
  }

  function back() {
    if (!playing) return;
    picked.current = false;
    setChannel(null);
    setBootDone(false);
    setBootHidden(false);
    setAgain(true);
    setPhase("pick");
    setMenuOpen(false);
    setIdle(false);
  }

  return (
    <div className="capychannel-page">
      <div
        className="capychannel-stage"
        data-paused={paused || dashboardOpen || undefined}
        data-booted={playing || undefined}
        data-idle={idle && !menuOpen ? "" : undefined}
      >
        <ChannelLayer channel={channel} paused={paused || dashboardOpen} />
        {playing ? <Ticker /> : null}
        <TvBar
          menuOpen={menuOpen}
          onMenuOpenChange={setAccountMenu}
          onBack={back}
          hint={playing && showHint}
          dot={playing && showDot}
        />
        <button
          type="button"
          className="tv-scrim"
          hidden={!menuOpen || onChooser}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
        {onChooser ? (
          <div className="tv-pick-chrome">
            <button
              type="button"
              className="tv-scrim"
              hidden={!menuOpen}
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="tv-pick-account">
              <AccountMenu
                open={menuOpen}
                onOpenChange={setAccountMenu}
                hint={showHint}
                dot={showDot}
                onHintClose={() => dismiss("source")}
              />
            </div>
          </div>
        ) : null}
        <div inert={menuOpen && onChooser ? true : undefined}>
          <Boot
            phase={phase}
            again={again}
            done={bootDone}
            hidden={bootHidden}
            tray={signedIn ? "pick" : "auth"}
          >
            {session ? (
              <ChannelPicker userId={session.user.id} onPick={pick} />
            ) : leaving ? null : (
              <BootAuth />
            )}
          </Boot>
        </div>
      </div>
    </div>
  );
}
