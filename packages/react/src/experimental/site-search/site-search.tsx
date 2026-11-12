"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { Dialog, DialogContent } from "../../dialog/dialog";
import { Input } from "../../input/input";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { Link } from "../../link/link";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";
import { Kbd } from "../kbd/kbd";

/** A page the search found: a product, an article, a docs page. */
export interface SiteSearchResult {
  /** Where it goes. Unique across the results. */
  href: string;
  /** The page's title. */
  title: string;
  /** One line about it, cut with an ellipsis where it's longer: the page's description. */
  description?: string;
  /** What it is, in small caps over the title: "Product", "Components · Actions". */
  kind?: string;
  /** After the kind: a Badge for its status ("Active"). */
  badge?: ReactNode;
  /** A line under the description: "Note added 28 Oct 2026". */
  note?: ReactNode;
}

export interface SiteSearchProps {
  /** The results for the query, best first, as the site ranks them; shown as given. */
  results: readonly SiteSearchResult[];
  /** Called as the query changes, so the site can search; with "" when the search closes. */
  onQueryChange: (query: string) => void;
  /**
   * Go to a result or to every result yourself, e.g. with the router: called with the `href`
   * instead of following the link. A click with a modifier key still opens the link in a new tab.
   */
  onNavigate?: (href: string) => void;
  /** Whether the search is open, controlled: wire it to the header's search button. */
  open?: boolean;
  /** Whether the search starts open, uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the new state when the search opens or closes: ⌘K, Escape, a result. */
  onOpenChange?: (open: boolean) => void;
  /** Open and close with ⌘K or Ctrl+K anywhere on the page. Default `true`. */
  hotkey?: boolean;
  /** The dialog's title, which names it: "Search Qeet Group". Default `Search`. */
  title?: string;
  /** The search box's placeholder: what's here to find. Default `Search…`. */
  placeholder?: string;
  /** Before anything is typed: a few queries to try ("Qeet ID", "payments"). Each fills the box. */
  suggestions?: readonly string[];
  /** Results are on their way: shows "Searching…". Default `false`. */
  loading?: boolean;
  /**
   * When `results` are only the first few: the site's search page for this query, and how many it
   * finds. The footer then links to it, "See all 32 results".
   */
  allResults?: { href: string; count: number };
  /** This search's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["siteSearch"]>;
}

/** The query in `text`: the whole of it where it appears, otherwise each word of it. */
function marked(text: string, query: string): ReactNode {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return text;
  const lower = text.toLocaleLowerCase();
  const spans: Array<[number, number]> = [];
  const whole = lower.indexOf(q);
  if (whole >= 0) spans.push([whole, whole + q.length]);
  else
    for (const word of q.split(/\s+/)) {
      // One letter would mark a letter in almost every line.
      const at = word.length > 1 ? lower.indexOf(word) : -1;
      if (at >= 0) spans.push([at, at + word.length]);
    }
  if (!spans.length) return text;
  spans.sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let from = 0;
  for (const [start, end] of spans) {
    if (end <= from) continue;
    const at = Math.max(start, from);
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="qx-site-search-match">
        {text.slice(at, end)}
      </mark>,
    );
    from = end;
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}

/** A link followed as a plain click: not a new tab, not a download. */
const plainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * The search across a website (marketing pages, docs), not a console's CommandPalette: a Dialog
 * near the top of the view with the site's title, a large search box, a few queries to try before
 * anything is typed, then the site's results, each its kind in small caps, its title and a line,
 * with the query marked. Arrows move through the results, Enter opens the highlighted one, Escape
 * closes and returns focus. Each result is a link, so it opens in a new tab too. The site searches
 * its own index (`onQueryChange`) and passes the results in.
 */
export function SiteSearch({
  results,
  onQueryChange,
  onNavigate,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = true,
  title,
  placeholder,
  suggestions,
  loading = false,
  allResults,
  messages,
}: SiteSearchProps): ReactElement {
  const strings = useMessages("siteSearch", messages);
  const [own, setOwn] = useState(defaultOpen);
  const shown = open ?? own;
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const tryId = useId();
  const name = title ?? strings.title;

  const ask = (next: string) => {
    setQuery(next);
    onQueryChange(next);
  };
  const setShown = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
    if (!next) ask("");
  };

  const toggle = useEffectEvent(() => setShown(!shown));
  useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hotkey]);

  // Enter clicks the highlighted result (Base UI presses it), so the keyboard and the pointer both
  // arrive here. Without `onNavigate` the link is followed; the search closes after it, so the
  // link is still in the page when the browser follows it.
  const follow = (event: MouseEvent, href: string) => {
    if (!plainClick(event)) return;
    if (onNavigate) {
      event.preventDefault();
      onNavigate(href);
      setShown(false);
    } else setTimeout(() => setShown(false));
  };

  const searching = query.trim() !== "";
  const status = loading
    ? strings.loading
    : searching && results.length === 0
      ? fill(strings.empty, { query: query.trim() })
      : null;

  return (
    <Dialog open={shown} onOpenChange={setShown}>
      <DialogContent title={name} size="lg" className="qx-site-search" initialFocus={input}>
        <BaseAutocomplete.Root
          inline
          open
          items={results as SiteSearchResult[]}
          filter={null}
          value={query}
          onValueChange={(next, details) => {
            // Choosing a result fills the box with its title; we go to it instead.
            if (details.reason === "item-press") return;
            ask(next);
          }}
          itemToStringValue={(result) => result.title}
          autoHighlight="always"
        >
          <div className="qx-site-search-field" data-slot="site-search-field">
            <BaseAutocomplete.Input
              ref={input}
              placeholder={placeholder ?? strings.placeholder}
              aria-label={name}
              autoComplete="off"
              spellCheck={false}
              render={
                <Input
                  icon={SearchIcon}
                  endAdornment={
                    searching ? (
                      <BaseAutocomplete.Clear
                        render={
                          <IconButton
                            icon={XIcon}
                            aria-label={strings.clear}
                            size="sm"
                            tone="neutral"
                            tooltip={false}
                          />
                        }
                      />
                    ) : null
                  }
                />
              }
            />
          </div>
          <div className="qx-site-search-body" data-slot="site-search-body">
            <BaseAutocomplete.Status
              className="qx-site-search-status"
              data-slot="site-search-status"
              aria-busy={loading || undefined}
            >
              {status ??
                (searching && (
                  <VisuallyHidden>
                    {results.length === 1
                      ? strings.resultOne
                      : fill(strings.results, { count: results.length })}
                  </VisuallyHidden>
                ))}
            </BaseAutocomplete.Status>
            {!searching && suggestions && suggestions.length > 0 && (
              <div className="qx-site-search-start" data-slot="site-search-start">
                <p className="qx-site-search-start-label" id={tryId}>
                  {strings.try}
                </p>
                <ul className="qx-site-search-suggestions" aria-labelledby={tryId}>
                  {suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        className="qx-site-search-suggestion"
                        data-slot="site-search-suggestion"
                        onClick={() => {
                          ask(suggestion);
                          input.current?.focus();
                        }}
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <BaseAutocomplete.List
              className="qx-site-search-results"
              data-slot="site-search-results"
              aria-label={name}
            >
              {(result: SiteSearchResult) => (
                <BaseAutocomplete.Item
                  key={result.href}
                  value={result}
                  className="qx-site-search-result"
                  data-slot="site-search-result"
                  render={<a href={result.href} />}
                  onClick={(event) => follow(event, result.href)}
                >
                  {(result.kind || result.badge != null) && (
                    <span className="qx-site-search-kind" data-slot="site-search-kind">
                      {result.kind}
                      {result.badge}
                    </span>
                  )}
                  <span className="qx-site-search-title" data-slot="site-search-title">
                    {marked(result.title, query)}
                  </span>
                  {result.description && (
                    <span
                      className="qx-site-search-description"
                      data-slot="site-search-description"
                    >
                      {marked(result.description, query)}
                    </span>
                  )}
                  {result.note != null && (
                    <span className="qx-site-search-note" data-slot="site-search-note">
                      {result.note}
                    </span>
                  )}
                </BaseAutocomplete.Item>
              )}
            </BaseAutocomplete.List>
          </div>
          <div className="qx-site-search-footer" data-slot="site-search-footer">
            <span className="qx-site-search-hints" aria-hidden>
              <span>
                <Kbd keys="ArrowUp ArrowDown" size="sm" /> {strings.move}
              </span>
              <span>
                <Kbd keys="Enter" size="sm" /> {strings.open}
              </span>
              <span>
                <Kbd keys="Escape" size="sm" /> {strings.close}
              </span>
            </span>
            {searching && allResults && allResults.count > 0 && (
              <Link
                href={allResults.href}
                className="qx-site-search-all"
                onClick={(event) => follow(event, allResults.href)}
              >
                {allResults.count === 1
                  ? strings.allOne
                  : fill(strings.all, { count: allResults.count })}
                <ArrowRightIcon size={16} aria-hidden />
              </Link>
            )}
          </div>
        </BaseAutocomplete.Root>
      </DialogContent>
    </Dialog>
  );
}
