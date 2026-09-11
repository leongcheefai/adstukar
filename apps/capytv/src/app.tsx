import { useEffect, useState } from "react";
import { Clock } from "./components/clock";
import { FeedTicker } from "./components/feed-ticker";
import { Pair } from "./components/pair";
import { Spot } from "./components/spot";
import { Weather } from "./components/weather";
import { usePlayer } from "./lib/player";
import { type Settings, loadDeviceKey, loadSettings, saveDeviceKey } from "./lib/storage";

/** The key may also arrive in the address, so a stick can be set up from a laptop. */
function keyFromUrl(): string | null {
  const key = new URLSearchParams(window.location.search).get("key");
  return key?.trim() || null;
}

/**
 * The screen. One content layer that is always there, and one overlay region
 * that comes and goes.
 */
export function App() {
  const [deviceKey, setDeviceKey] = useState<string | null>(() => keyFromUrl() ?? loadDeviceKey());
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showStatus, setShowStatus] = useState(false);
  const player = usePlayer(deviceKey);

  // A key in the address is a one-time hand-off; keep it and take it back out, so
  // a screen left on a wall is not showing its own credential.
  useEffect(() => {
    const fromUrl = keyFromUrl();
    if (!fromUrl) return;
    saveDeviceKey(fromUrl);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // A kiosk has no cursor, so the status line is a corner tap rather than a
  // button: an installer can see the screen's state without a keyboard.
  useEffect(() => {
    const id = showStatus ? setTimeout(() => setShowStatus(false), 20_000) : undefined;
    return () => {
      if (id) clearTimeout(id);
    };
  }, [showStatus]);

  if (!deviceKey || player.pairingError) {
    return (
      <Pair
        initialKey={deviceKey ?? ""}
        settings={settings}
        error={player.pairingError}
        onPaired={(key, next) => {
          setSettings(next);
          setDeviceKey(key);
          // The key changed, so nothing the old one cached may play again.
          window.location.reload();
        }}
      />
    );
  }

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-neutral-950">
      {/* The content layer. It is the reason the venue leaves the screen on, so
          it never moves for the overlay and is never covered by more than one
          region at a time. */}
      <div className="absolute inset-0 flex flex-col justify-between p-[5vw] pb-[16vh]">
        <div className="flex items-start justify-between">
          <Clock />
          {settings.latitude !== null && settings.longitude !== null ? (
            <Weather latitude={settings.latitude} longitude={settings.longitude} />
          ) : null}
        </div>
        {settings.feedUrl ? <FeedTicker url={settings.feedUrl} /> : null}
      </div>

      {player.current ? <Spot item={player.current} /> : null}

      {/* Tap the top-left corner to see what the screen is doing. */}
      <button
        type="button"
        aria-label="Show screen status"
        onClick={() => setShowStatus((on) => !on)}
        className="absolute top-0 left-0 z-20 h-[8vh] w-[8vw] cursor-default opacity-0"
      />
      {showStatus ? (
        <p className="absolute top-[1vh] left-[1vw] z-20 rounded-lg bg-black/70 px-[1.2vw] py-[0.8vh] font-mono text-[1.1vw] text-white/70">
          {player.online ? "online" : "offline"} · {player.cached} cached · {player.pending} to
          report
        </p>
      ) : null}
    </main>
  );
}
