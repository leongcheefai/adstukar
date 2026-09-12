import { type ReactNode, useEffect, useRef } from "react";
import { CapyLockup } from "./lockup";

export type BootPhase = "brand" | "pick";

export function Boot({
  phase,
  again,
  done,
  hidden,
  tray = "pick",
  children,
}: {
  phase: BootPhase;
  again: boolean;
  done: boolean;
  hidden: boolean;
  tray?: "pick" | "auth";
  children: ReactNode;
}) {
  const pickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "pick" || hidden) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const first = pickRef.current?.querySelector<HTMLElement>('input[type="email"], input, button');
    first?.focus();
  }, [phase, hidden]);

  return (
    <div
      className="capytv-boot"
      data-phase={phase}
      data-tray={tray}
      data-again={again || undefined}
      data-done={done || undefined}
      hidden={hidden}
    >
      <div className="boot-screen">
        <div className="boot-noise" aria-hidden />
        <div className="boot-roll" aria-hidden />
        <div className="boot-stack">
          <div className="boot-brand" aria-hidden>
            <CapyLockup />
          </div>
          <div className="boot-tray" ref={pickRef}>
            {children}
          </div>
        </div>
        <div className="boot-scan" aria-hidden />
        <div className="boot-vignette" aria-hidden />
      </div>
      <div className="boot-flash" aria-hidden />
      <div className="boot-line" aria-hidden />
    </div>
  );
}
