import type * as React from "react";
import { useEffect, useRef } from "react";
import { mount } from "./mount";

export interface AdsTukarProps {
  /** The placement's public key (`pk_…`). */
  apiKey: string;
  /** API origin override for self-hosting. */
  api?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders the target element and mounts the card into it directly — no script injection.
 * The element is keyed on `apiKey`/`api`, so a change produces a fresh node and a fresh mount.
 */
export function AdsTukar({ apiKey, api, className, style }: AdsTukarProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) void mount(el, { key: apiKey, api });
  }, [apiKey, api]);

  return (
    <div
      key={`${apiKey} ${api ?? ""}`}
      ref={ref}
      className={className}
      style={style}
      data-adstukar-key={apiKey}
      data-adstukar-api={api}
    />
  );
}
