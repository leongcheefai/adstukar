import { cn } from "@repo/ui";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/coach.css";

function visibleAnchors(pathname: string): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const node of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (node.pathname !== pathname) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.right < 0 || rect.bottom < 0) continue;
    if (rect.left > window.innerWidth || rect.top > window.innerHeight) continue;
    out.push(node);
  }
  return out;
}

type Side = "right" | "bottom" | "float";

const WIDTH = 360;
/* The hole is the control's own box. Sidebar rows sit 2px apart, so any
   padding here would spill the light onto the row above. */
const HOLE_PAD = 0;

/**
 * The dim sheet with a window over the control. An even-odd polygon: the outer
 * ring is the viewport, the inner ring the hole, so the sheet is clipped away
 * over the control and a click there reaches it. Everywhere else the sheet
 * takes the click.
 */
function holeClip(rect: DOMRect): string {
  const x1 = Math.max(0, rect.left - HOLE_PAD);
  const y1 = Math.max(0, rect.top - HOLE_PAD);
  const x2 = rect.right + HOLE_PAD;
  const y2 = rect.bottom + HOLE_PAD;
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`;
}

/**
 * A first-run tip pinned next to the first visible link to `targetPath`: the
 * sidebar on desktop, an overview button on a phone. With no link on screen
 * the tip floats at the bottom of the viewport, so a step is never lost
 * because the control it points at sits inside a closed menu.
 *
 * `onOutside` fires on a click outside the tip or on Escape, and `onClose`
 * on the Got it button. The caller decides what a closed tip means; the tip
 * itself never changes coach state.
 *
 * Same card as the tip on the source chooser (`.tv-coach`): white, a blue
 * title, the copy under it, Got it bottom right. One design for every
 * first-run tip.
 */
export function CoachTip({
  open,
  targetPath,
  title,
  onOutside,
  onClose,
  children,
}: {
  open: boolean;
  targetPath: string;
  title: string;
  onOutside?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [side, setSide] = useState<Side>("float");
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }

    function sync() {
      const next = visibleAnchors(targetPath)[0] ?? null;
      setRect(next?.getBoundingClientRect() ?? null);
      if (!next) setSide("float");
      else setSide(window.matchMedia("(min-width: 768px)").matches ? "right" : "bottom");
    }

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(document.documentElement);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, targetPath]);

  useEffect(() => {
    if (!open || !onOutside) return;

    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && box.current?.contains(target)) return;
      onOutside?.();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOutside?.();
    }

    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOutside]);

  if (!open) return null;

  const style =
    side === "right" && rect
      ? {
          top: rect.top + rect.height / 2,
          left: rect.right + 12,
          transform: "translateY(-50%)",
        }
      : side === "bottom" && rect
        ? {
            top: rect.bottom + 12,
            left: Math.min(rect.left, window.innerWidth - WIDTH - 16),
          }
        : {
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
          };

  return createPortal(
    <>
      {/* The sheet closes the tip the way a click outside does: an ignore
          where the caller draws that line, a plain close otherwise. */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="dash-coach-overlay animate-in fade-in-0 duration-200 motion-reduce:animate-none"
        style={rect && side !== "float" ? { clipPath: holeClip(rect) } : undefined}
        onClick={onOutside ?? onClose}
      />
      <div ref={box} style={style} className="fixed z-[260]">
        <div
          aria-live="polite"
          className={cn(
            "dash-coach-tip",
            "animate-in fade-in-0 zoom-in-95 duration-200 ease-out motion-reduce:animate-none",
            side === "right" && "origin-left slide-in-from-left-2",
            side === "bottom" && "origin-top slide-in-from-top-2",
            side === "float" && "origin-bottom slide-in-from-bottom-2",
          )}
        >
          {side !== "float" && (
            <span
              aria-hidden
              className={cn(
                "dash-coach-arrow",
                side === "right" && "dash-coach-arrow-left",
                side === "bottom" && "dash-coach-arrow-top",
              )}
            />
          )}
          <p className="dash-coach-title">{title}</p>
          {children}
          <div className="dash-coach-foot">
            <button type="button" className="dash-coach-ok" onClick={onClose}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
