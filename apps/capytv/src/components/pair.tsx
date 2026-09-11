import { project } from "@repo/config/project";
import { type FormEvent, useState } from "react";
import { type Settings, saveDeviceKey, saveSettings } from "../lib/storage";

/**
 * Pairing. The distributor registers the screen in the dashboard, an admin
 * approves it, and the dashboard hands back the key that goes in here. The venue
 * sets the two content details at the same time, because nobody wants to come
 * back to a kiosk with a keyboard twice.
 */
export function Pair({
  initialKey,
  settings,
  error,
  onPaired,
}: {
  initialKey: string;
  settings: Settings;
  error: string | null;
  onPaired: (key: string, settings: Settings) => void;
}) {
  const [key, setKey] = useState(initialKey);
  const [feedUrl, setFeedUrl] = useState(settings.feedUrl ?? "");
  const [coords, setCoords] = useState(
    settings.latitude !== null && settings.longitude !== null
      ? `${settings.latitude}, ${settings.longitude}`
      : "",
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;

    const [lat, lon] = coords.split(",").map((part) => Number.parseFloat(part.trim()));
    const next: Settings = {
      latitude: Number.isFinite(lat) ? (lat as number) : null,
      longitude: Number.isFinite(lon) ? (lon as number) : null,
      feedUrl: feedUrl.trim() || null,
    };

    saveDeviceKey(trimmed);
    saveSettings(next);
    onPaired(trimmed, next);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-950 p-8 text-white">
      <form onSubmit={submit} className="w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">{project.name} TV</h1>
        <p className="mt-2 text-sm text-white/55">
          Paste the screen key from your {project.name} dashboard. An admin approves a screen before
          it plays anything.
        </p>

        {error ? (
          <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}

        <label className="mt-6 block text-sm text-white/70" htmlFor="key">
          Screen key
        </label>
        <input
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="dk_…"
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm outline-none focus:border-white/40"
        />

        <label className="mt-5 block text-sm text-white/70" htmlFor="coords">
          Where the screen is <span className="text-white/35">(latitude, longitude)</span>
        </label>
        <input
          id="coords"
          value={coords}
          onChange={(e) => setCoords(e.target.value)}
          autoComplete="off"
          placeholder="3.139, 101.687"
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
        />

        <label className="mt-5 block text-sm text-white/70" htmlFor="feed">
          Local feed <span className="text-white/35">(an RSS or Atom address)</span>
        </label>
        <input
          id="feed"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="https://…/feed.xml"
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
        />

        <button
          type="submit"
          className="mt-7 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-neutral-950"
        >
          Start the screen
        </button>
      </form>
    </main>
  );
}
