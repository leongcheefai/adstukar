import { useEffect } from "react";

/**
 * Lets the set run under the notch and the home indicator of an iPhone. With
 * the default viewport, Safari keeps the page out of those areas and paints
 * them in the page colour, which reads as a bar on each side of the set. The
 * set pads itself with `env(safe-area-inset-*)`; the dashboard does not, so
 * the viewport goes back to the default when the set unmounts.
 */
export function useViewportFitCover(): void {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta || meta.content.includes("viewport-fit")) return;
    const before = meta.content;
    meta.content = `${before}, viewport-fit=cover`;
    return () => {
      meta.content = before;
    };
  }, []);
}
