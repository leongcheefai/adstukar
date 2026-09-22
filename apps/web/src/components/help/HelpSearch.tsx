import { Input } from "@repo/ui";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HELP_SEARCH_HASH, helpHref } from "../../lib/help";
import { type HelpSearchEntry, searchHelp } from "../../lib/help-search";

/**
 * The help home's search: a field, and under it the sections that match. With
 * no query there is nothing under the field; the side menu holds the topics.
 */
export function HelpSearch({
  entries,
  supportEmail,
}: {
  entries: HelpSearchEntry[];
  supportEmail: string;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchHelp(entries, query), [entries, query]);
  const searching = query.trim().length > 0;
  const field = useRef<HTMLInputElement>(null);
  // The key hint names the platform's own key, which only the browser knows.
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K");
    // A topic page sends its own ⌘K here with this hash.
    if (window.location.hash === HELP_SEARCH_HASH) field.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        field.current?.focus();
        field.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <search className="relative mx-auto mt-8 block max-w-xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={field}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            setQuery("");
            event.currentTarget.blur();
          }}
          placeholder="Search the help center"
          aria-label="Search the help center"
          autoComplete="off"
          className="h-12 rounded-full border-border bg-card pr-20 pl-11 text-base [&::-webkit-search-cancel-button]:hidden"
        />
        {shortcut && !searching && (
          <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs text-muted-foreground sm:block">
            {shortcut}
          </kbd>
        )}
      </search>

      {searching && (
        <section aria-live="polite" className="mt-10">
          <p className="text-sm text-muted-foreground tabular-nums">
            {results.length === 1 ? "1 result" : `${results.length} results`}
          </p>
          {results.length > 0 ? (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {results.map(({ entry, snippet }) => (
                <li key={`${entry.topic}#${entry.section ?? ""}`}>
                  <a
                    href={helpHref(entry.topic, entry.section)}
                    className="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span>
                      <span className="block text-xs text-muted-foreground">
                        {entry.topicTitle}
                      </span>
                      <span className="mt-1 block font-medium transition-colors duration-150 ease-out group-hover:text-primary">
                        {entry.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{snippet}</span>
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted-foreground">
              No topic contains these words. Use different words, or write to{" "}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                {supportEmail}
              </a>
              .
            </p>
          )}
        </section>
      )}
    </>
  );
}
