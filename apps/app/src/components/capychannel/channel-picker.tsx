import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { CHANNELS, type ChannelId, type ChannelPick, WALLPAPERS } from "./channels/catalog";
import { isPlayable } from "./channels/upload";

type View = "channels" | "wallpapers";

export function ChannelPicker({
  onPick,
}: {
  onPick: (pick: ChannelPick) => void;
}) {
  const [view, setView] = useState<View>("channels");
  const fileRef = useRef<HTMLInputElement>(null);
  const trayRef = useRef<HTMLFieldSetElement>(null);
  const moved = useRef(false);

  // The tiles remount when the view changes, and the focus goes with them.
  // Boot owns the first focus, so this runs only after a change of view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: view is the trigger
  useEffect(() => {
    if (!moved.current) return;
    trayRef.current?.querySelector<HTMLElement>("[data-first]")?.focus();
  }, [view]);

  function show(next: View) {
    moved.current = true;
    setView(next);
  }

  function open(id: ChannelId) {
    if (id === "upload") fileRef.current?.click();
    else show("wallpapers");
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].filter(isPlayable);
    // Cleared, so the same files can be chosen a second time.
    event.target.value = "";
    if (files.length > 0) onPick({ id: "upload", files });
  }

  function onKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
    if (event.key === "Escape" && view === "wallpapers") {
      show("channels");
      event.preventDefault();
      return;
    }
    const buttons = [...event.currentTarget.querySelectorAll("button")];
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
      {/* After the tiles: Boot gives the first focus to the first control it finds. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={onFiles}
      />
    </fieldset>
  );
}
