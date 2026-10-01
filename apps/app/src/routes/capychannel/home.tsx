import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AccountMenu } from "../../components/capychannel/account-menu";
import { Boot, type BootPhase } from "../../components/capychannel/boot";
import { BootAuth } from "../../components/capychannel/boot-auth";
import { ChannelPicker } from "../../components/capychannel/channel-picker";
import type { ChannelPick } from "../../components/capychannel/channels/catalog";
import { ChannelLayer } from "../../components/capychannel/channels/layer";
import { RegisterScreenDialog } from "../../components/capychannel/register-screen";
import { loadScreenPick, saveScreenPick } from "../../components/capychannel/resume";
import { Ticker } from "../../components/capychannel/ticker";
import { TvBar } from "../../components/capychannel/tv-bar";
import { useSession } from "../../lib/auth";
import { useCoach } from "../../lib/coach";
import { safeRedirect } from "../../lib/redirect";
import { useScreen } from "../../lib/screen/use-screen";
import { useViewportFitCover } from "../../lib/viewport";
import "../../styles/capychannel.css";

const BAR_IDLE_MS = 3500;
const BOOT_FADE_MS = 600;

function brandHoldMs(): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 2500;
}

/**
 * The front door. A session sees the channel tiles; no session sees the login
 * form on the same set (`?auth=` picks login, sign-up or a reset). The
 * dashboard is not here: it opens in its own tab (`lib/dashboard-tab.ts`).
 */
export function CapyChannelScreen() {
  useViewportFitCover();
  const { data: session, isPending } = useSession();
  const { source: sourceHint, opened, dismiss } = useCoach();
  const navigate = useNavigate();
  const { search } = useLocation();
  const signedIn = Boolean(session);
  const screen = useScreen();
  const [registering, setRegistering] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  // A registered set plays with no session (docs/adr/0016): a venue's browser
  // reloads on its own, and nobody is there to sign in again.
  const unattended = screen.key !== null && !signedIn && !isPending;
  // The dashboard sends a visitor with no session here with `?redirect=`. Once
  // they sign in, they go back to the page they asked for.
  const redirect = safeRedirect(search);
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
  const onChooser = signedIn && phase === "pick" && !playing;
  const showHint = sourceHint && hintReady;
  // A red dot on the account until the dashboard has been opened once. Not
  // while the tip is up: the tip already points at the same control.
  const showDot = !opened && !showHint;

  useEffect(() => {
    if (signedIn && redirect !== "/") navigate(redirect, { replace: true });
  }, [signedIn, redirect, navigate]);

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
    if (signedIn) setSigningIn(false);
  }, [signedIn]);

  useEffect(() => {
    if (isPending || signedIn || unattended) return;
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
  }, [isPending, signedIn, unattended]);

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
    if (!signedIn || !sourceHint || (phase !== "pick" && !playing)) {
      setHintReady(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setHintReady(true), reduce || again ? 200 : 700);
    return () => window.clearTimeout(id);
  }, [signedIn, sourceHint, phase, playing, again]);

  useEffect(() => {
    if (!playing || menuOpen || showHint) {
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
  }, [playing, menuOpen, showHint]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
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
  }, [playing, menuOpen]);

  function setAccountMenu(open: boolean) {
    setMenuOpen(open);
    if (open) dismiss("source");
  }

  function pick(next: ChannelPick) {
    if ((!signedIn && !unattended) || picked.current) return;
    picked.current = true;
    setChannel(next);
    setBootDone(true);
    if (screen.key) saveScreenPick(next);
  }

  // An unattended set starts on its stored channel once the brand has shown.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pick reads refs; the effect must run on these three only
  useEffect(() => {
    if (!unattended || signingIn || phase === "brand" || picked.current) return;
    pick(loadScreenPick() ?? { id: "tv" });
  }, [unattended, signingIn, phase]);

  /** "Sign in" on an unattended set: stop the channel and show the sign-in tray. */
  function signIn() {
    setSigningIn(true);
    picked.current = false;
    setChannel(null);
    setBootDone(false);
    setBootHidden(false);
    setAgain(true);
    setPhase("pick");
  }

  const onRegister = signedIn && !screen.key ? () => setRegistering(true) : undefined;

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
        data-paused={paused || undefined}
        data-booted={playing || undefined}
        data-idle={idle && !menuOpen ? "" : undefined}
      >
        <ChannelLayer channel={channel} paused={paused} />
        {playing ? <Ticker bands={screen.bands} onCrossing={screen.onCrossing} /> : null}
        <TvBar
          menuOpen={menuOpen}
          onMenuOpenChange={setAccountMenu}
          onBack={back}
          hint={playing && showHint}
          dot={playing && showDot}
          status={screen.status}
          pending={screen.pending}
          rejectionReason={screen.rejectionReason}
          onRegister={onRegister}
          onSignIn={unattended ? signIn : undefined}
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
                onRegister={onRegister}
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
            {session ? <ChannelPicker userId={session.user.id} onPick={pick} /> : <BootAuth />}
          </Boot>
        </div>
        <RegisterScreenDialog
          open={registering}
          onOpenChange={setRegistering}
          onRegistered={screen.register}
        />
      </div>
    </div>
  );
}
