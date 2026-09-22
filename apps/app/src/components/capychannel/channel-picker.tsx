import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { lastInputWasKeyboard } from "../../lib/input-mode";
import { CHANNELS, type ChannelId, type ChannelPick, WALLPAPERS } from "./channels/catalog";
import { Library } from "./library";

type View = "channels" | "wallpapers" | "library";

export function ChannelPicker({
  userId,
  onPick,
}: {
  userId: string;
  onPick: (pick: ChannelPick) => void;
}) {
  const [view, setView] = useState<View>("channels");
  const trayRef = useRef<HTMLFieldSetElement>(null);
  const moved = useRef(false);

  // The tiles remount when the view changes, and the focus goes with them.
  // Boot owns the first focus, so this runs only after a change of view, and
  // only for a keyboard: a mouse would see a ring it did not ask for.
  // biome-ignore lint/correctness/useExhaustiveDependencies: view is the trigger
  useEffect(() => {
    if (!moved.current || !lastInputWasKeyboard()) return;
    trayRef.current?.querySelector<HTMLElement>("[data-first]")?.focus();
  }, [view]);

  function show(next: View) {
    moved.current = true;
    setView(next);
  }

  function open(id: ChannelId) {
    show(id === "upload" ? "library" : "wallpapers");
  }

  function onKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
    // A dialog renders in a portal. Its keys bubble here through React, not
    // through the DOM, and they belong to the dialog.
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    if (event.key === "Escape" && view !== "channels") {
      show("channels");
      event.preventDefault();
      return;
    }
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
    ];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    if (event.key === "ArrowRight") {
      buttons[(i + 1) % buttons.length]?.focus();
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
      event.preventDefault();
    }
  }

  if (view === "library") {
    return (
      <fieldset
        key="library"
        ref={trayRef}
        className="boot-pick boot-pick-lib"
        onKeyDown={onKeyDown}
      >
        <legend className="sr-only">Your images and video</legend>
        <Library
          userId={userId}
          onBack={() => show("channels")}
          onPlay={(items) => onPick({ id: "upload", items })}
        />
      </fieldset>
    );
  }

  if (view === "wallpapers") {
    return (
      <fieldset
        key="wallpapers"
        ref={trayRef}
        className="boot-pick boot-pick-walls"
        onKeyDown={onKeyDown}
      >
        <legend className="sr-only">Choose a wallpaper</legend>
        <button type="button" aria-label="Back" onClick={() => show("channels")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.6 6.2 8.8 12l5.8 5.8" />
          </svg>
        </button>
        {WALLPAPERS.map((wallpaper, i) => (
          <button
            key={wallpaper.id}
            type="button"
            data-first={i === 0 || undefined}
            onClick={() => onPick({ id: "wallpaper", wallpaper: wallpaper.id })}
          >
            <span className={`boot-wall wall wall-${wallpaper.id}`} aria-hidden="true" />
            <span>{wallpaper.label}</span>
          </button>
        ))}
      </fieldset>
    );
  }

  return (
    <fieldset
      key="channels"
      ref={trayRef}
      className="boot-pick boot-pick-channels"
      onKeyDown={onKeyDown}
    >
      <legend className="sr-only">Choose a channel</legend>
      {CHANNELS.map((channel) => (
        <button
          key={channel.id}
          type="button"
          data-first={channel.id === "wallpaper" || undefined}
          onClick={() => open(channel.id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {channel.icon}
          </svg>
          <span>{channel.label}</span>
        </button>
      ))}
    </fieldset>
  );
}
