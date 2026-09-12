import { useEffect, useRef, useState } from "react";
import { Boot, type BootPhase } from "../../components/capytv/boot";
import { BootAuth } from "../../components/capytv/boot-auth";
import { SourcePicker } from "../../components/capytv/source-picker";
import type { SourceId } from "../../components/capytv/sources/catalog";
import { SourceLayer } from "../../components/capytv/sources/layer";
import { Ticker } from "../../components/capytv/ticker";
import { TvBar } from "../../components/capytv/tv-bar";
import { useSession } from "../../lib/auth";
import "../../styles/capytv.css";

const BAR_IDLE_MS = 3500;
const BOOT_FADE_MS = 600;

function brandHoldMs(): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 2500;
}

export function CapyTvScreen({ dashboardOpen = false }: { dashboardOpen?: boolean }) {
  const { data: session, isPending } = useSession();
  const signedIn = Boolean(session);

  const [phase, setPhase] = useState<BootPhase>("brand");
  const [brandHeld, setBrandHeld] = useState(false);
  const [again, setAgain] = useState(false);
  const [source, setSource] = useState<SourceId | null>(null);
  const [bootDone, setBootDone] = useState(false);
  const [bootHidden, setBootHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [paused, setPaused] = useState(false);
  const picked = useRef(false);
  const hadSession = useRef(false);

  const playing = source !== null && bootDone;

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
    setSource(null);
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
    if (!playing || menuOpen || dashboardOpen) {
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
  }, [playing, menuOpen, dashboardOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (dashboardOpen) return;
      if (!playing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)
      ) {
        return;
      }
      if (menuOpen) setMenuOpen(false);
      else back();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playing, menuOpen, dashboardOpen]);

  function pick(id: SourceId) {
    if (!signedIn || picked.current) return;
    picked.current = true;
    setSource(id);
    setBootDone(true);
  }

  function back() {
    if (!playing) return;
    picked.current = false;
    setSource(null);
    setBootDone(false);
    setBootHidden(false);
    setAgain(true);
    setPhase("pick");
    setMenuOpen(false);
    setIdle(false);
  }

  return (
    <div className="capytv-page">
      <div
        className="capytv-stage"
        data-paused={paused || dashboardOpen || undefined}
        data-booted={playing || undefined}
        data-idle={idle && !menuOpen ? "" : undefined}
      >
        <SourceLayer source={source} />
        {playing ? <Ticker /> : null}
        <TvBar menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onBack={back} />
        <button
          type="button"
          className="tv-scrim"
          hidden={!menuOpen}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
        <Boot
          phase={phase}
          again={again}
          done={bootDone}
          hidden={bootHidden}
          tray={signedIn ? "pick" : "auth"}
        >
          {signedIn ? <SourcePicker onPick={pick} /> : <BootAuth />}
        </Boot>
      </div>
    </div>
  );
}
