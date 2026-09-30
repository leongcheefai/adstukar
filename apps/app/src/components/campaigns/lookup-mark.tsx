import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import type { LookupState } from "../../lib/site-lookup";

/** What a URL field says under itself for each state of the site check. */
export const LOOKUP_MESSAGE: Record<LookupState, string> = {
  idle: "",
  checking: "",
  // The mark in the field says it. A line of text under a field that is right is noise.
  ok: "",
  failed: "We could not reach this site. Check the address.",
};

/**
 * The mark at the end of a URL field while the site is checked. A check, not
 * the seal: the seal on a slot row means the domain is proved to be the
 * member's, and this says only that the site answers.
 */
export function LookupMark({ state }: { state: LookupState }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      {state === "checking" && (
        <CircleNotch
          size={18}
          className="animate-spin text-muted-foreground"
          aria-label="Checking the site"
        />
      )}
      {state === "ok" && (
        <CheckCircle size={18} weight="fill" className="text-primary" aria-label="Site found" />
      )}
    </span>
  );
}
