import { embedConfig } from "./config";
import type { AdSize, ServedAd } from "./types";

/**
 * The fixed sponsored-card template, vanilla-DOM edition. Mirrors
 * `packages/ui/src/patterns/ad-card.tsx`; keep the two in step when either changes.
 * Every style is inline so the host page's stylesheet cannot reshape it, and every string
 * from the server lands in `textContent` — never in markup.
 */
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MUTED = "#71717a";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  return node;
}

function renderLogo(ad: ServedAd, px: number, small: boolean): HTMLElement {
  const box = `flex:0 0 ${px}px;width:${px}px;height:${px}px;border-radius:6px;`;
  if (ad.logoUrl) {
    const img = el("img", `${box}object-fit:cover;`);
    img.src = ad.logoUrl;
    img.alt = "";
    img.width = px;
    img.height = px;
    return img;
  }
  const mono = el(
    "span",
    `${box}display:flex;align-items:center;justify-content:center;background:#f4f4f5;color:${MUTED};font-weight:600;font-size:${small ? 16 : 18}px;`,
  );
  mono.setAttribute("aria-hidden", "true");
  mono.textContent = ad.name.trim().charAt(0).toUpperCase() || "?";
  return mono;
}

export function renderCard(ad: ServedAd, size: AdSize): HTMLAnchorElement {
  const { width, height } = embedConfig.cardSizes[size];
  const small = size === "small";

  const card = el(
    "a",
    `position:relative;box-sizing:border-box;display:flex;align-items:${small ? "center" : "flex-start"};gap:12px;width:${width}px;max-width:100%;height:${height}px;margin:0;padding:${small ? "0 12px" : "12px 12px 0"};overflow:hidden;border:1px solid #e4e4e7;border-radius:8px;background:#ffffff;color:#18181b;font-family:${FONT};font-size:12px;line-height:1.25;text-decoration:none;`,
  );
  card.href = ad.clickUrl;
  card.target = "_blank";
  card.rel = "sponsored noopener";
  card.setAttribute("data-adstukar-card", size);

  const body = el("span", "display:block;flex:1 1 auto;min-width:0;padding-right:56px;");

  const name = el(
    "span",
    "display:block;font-size:13px;font-weight:600;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
  );
  name.textContent = ad.name;

  const tagline = el(
    "span",
    small
      ? `display:block;font-size:12px;line-height:1.4;color:${MUTED};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`
      : `display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;margin-top:2px;font-size:12px;line-height:1.4;color:${MUTED};overflow:hidden;`,
  );
  tagline.textContent = ad.tagline;

  const label = el(
    "span",
    `position:absolute;top:8px;right:10px;font-size:10px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};`,
  );
  label.textContent = "Sponsored";

  body.append(name, tagline);
  card.append(renderLogo(ad, small ? 40 : 48, small), body, label);
  return card;
}
