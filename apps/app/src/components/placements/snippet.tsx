import { embedScriptUrl } from "../../lib/products";

export function htmlSnippet(apiKey: string): string {
  return `<div data-adstukar-key="${apiKey}"></div>\n<script async src="${embedScriptUrl()}"></script>`;
}

export function reactSnippet(apiKey: string): string {
  return `import { useEffect } from "react";

export function SponsoredCard() {
  useEffect(() => {
    if (document.querySelector('script[data-adstukar]')) return;
    const s = document.createElement("script");
    s.src = "${embedScriptUrl()}";
    s.async = true;
    s.dataset.adstukar = "1";
    document.body.appendChild(s);
  }, []);
  return <div data-adstukar-key="${apiKey}" />;
}`;
}
