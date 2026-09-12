import type { KeyboardEvent } from "react";
import { SOURCES, type SourceId } from "./sources/catalog";

export function SourcePicker({
  onPick,
}: {
  onPick: (id: SourceId) => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
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

  return (
    <fieldset className="boot-pick" onKeyDown={onKeyDown}>
      <legend className="sr-only">What do you want to show?</legend>
      {SOURCES.map((source) => (
        <button key={source.id} type="button" onClick={() => onPick(source.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {source.icon}
          </svg>
          <span>{source.label}</span>
        </button>
      ))}
    </fieldset>
  );
}
