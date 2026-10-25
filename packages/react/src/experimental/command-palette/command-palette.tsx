"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import { type ReactElement, type ReactNode, useEffect, useEffectEvent, useState } from "react";
import { Avatar } from "../../avatar/avatar";
import type { QeetrixIcon } from "../../internal/control";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

/** Something to find and go to: a record, a page, a setting or an action. */
export interface CommandItem {
  /** Unique across the palette. */
  value: string;
  /** What it's called; matched as you type. */
  label: string;
  /** A line under the label: an email, a type. */
  description?: string;
  /** At the end: where it lives ("Security › Policies"), or a kind ("OIDC"). */
  meta?: ReactNode;
  /** A 16px icon before the label. */
  icon?: QeetrixIcon;
  /** A person's avatar before the label, instead of an icon. */
  avatar?: { name: string; src?: string };
  /** The keys of its own shortcut, shown at the end: `["I"]`. */
  shortcut?: readonly string[];
  /** More words it's found by: "MFA" for "Two-step sign-in". */
  keywords?: readonly string[];
  /** Shown, but it can't be chosen: greyed, skipped by the arrows and by Enter. */
  disabled?: boolean;
}

/** A titled group of results: Users, Applications, Settings, Actions. */
export interface CommandGroup {
  label: string;
  items: readonly CommandItem[];
}

export interface CommandPaletteProps {
  /** The results, grouped. Filtered as you type, unless `onQueryChange` searches for them. */
  groups: readonly CommandGroup[];
  /** Called with the chosen item; the palette then closes. */
  onSelect: (item: CommandItem) => void;
  /** Whether the palette is open, controlled: wire it to the TopBar's search. */
  open?: boolean;
  /** Whether the palette starts open, uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the new state when the palette opens or closes: ⌘K, Escape, a choice. */
  onOpenChange?: (open: boolean) => void;
  /** Open and close with ⌘K or Ctrl+K anywhere on the page. Default `true`. */
  hotkey?: boolean;
  /**
   * Search for results yourself, e.g. on the server, as the query changes; `groups` are then shown
   * as given, not filtered.
   */
  onQueryChange?: (query: string) => void;
  /** Results are on their way, for `onQueryChange`: shows "Searching…". Default `false`. */
  loading?: boolean;
  /** The search box's placeholder. Default `Search or jump to…`. */
  placeholder?: string;
  /** This palette's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["commandPalette"]>;
}

const matches = (item: CommandItem, query: string) => {
  const q = query.trim().toLocaleLowerCase();
  return (
    !q ||
    [item.label, item.description ?? "", ...(item.keywords ?? [])].some((text) =>
      text.toLocaleLowerCase().includes(q),
    )
  );
};

/** The label with the typed text in bold, where it appears. */
function marked(label: string, query: string): ReactNode {
  const q = query.trim();
  const at = q ? label.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()) : -1;
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <b className="qx-command-match">{label.slice(at, at + q.length)}</b>
      {label.slice(at + q.length)}
    </>
  );
}

const Key = ({ children }: { children: ReactNode }) => (
  <kbd className="qx-command-key">{children}</kbd>
);

/**
 * Search or jump to: a dialog over the page, opened from the top bar's search or
 * ⌘K / Ctrl+K, with a search box and grouped results to go to. Arrows move through the results,
 * Enter opens the highlighted one, Escape closes and returns focus. Results filter as you type
 * (label, description and keywords), or the app searches with `onQueryChange`. Every console shares
 * it; each product supplies its own results.
 */
export function CommandPalette({
  groups,
  onSelect,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = true,
  onQueryChange,
  loading = false,
  placeholder,
  messages,
}: CommandPaletteProps): ReactElement {
  const strings = useMessages("commandPalette", messages);
  const [own, setOwn] = useState(defaultOpen);
  const shown = open ?? own;
  const [query, setQuery] = useState("");

  const setShown = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
    if (!next) {
      setQuery("");
      onQueryChange?.("");
    }
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

  const choose = (item: CommandItem) => {
    if (item.disabled) return;
    onSelect(item);
    setShown(false);
  };

  const filtering = onQueryChange === undefined;
  const results = groups
    .map((group) => ({
      ...group,
      items: filtering ? group.items.filter((item) => matches(item, query)) : group.items,
    }))
    .filter((group) => group.items.length > 0);

  return (
    <BaseDialog.Root open={shown} onOpenChange={setShown}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="qx-command-backdrop" />
        <BaseDialog.Popup
          className="qx-command"
          aria-label={strings.label}
          data-slot="command-palette"
        >
          <BaseAutocomplete.Root
            inline
            open
            items={results as unknown as CommandItem[]}
            filteredItems={results as unknown as CommandItem[]}
            filter={null}
            value={query}
            onValueChange={(next, details) => {
              // Choosing an item fills the box with its label; we go to it instead.
              if (details.reason === "item-press") return;
              setQuery(next);
              onQueryChange?.(next);
            }}
            itemToStringValue={(item) => item.label}
            autoHighlight="always"
          >
            <div className="qx-command-search">
              <SearchIcon shape="sharp" size={20} aria-hidden className="qx-command-search-icon" />
              {/* Enter opens the highlighted result: Base UI presses it, so its onClick runs. */}
              <BaseAutocomplete.Input
                className="qx-command-input"
                placeholder={placeholder ?? strings.placeholder}
                aria-label={strings.label}
              />
              <Key>Esc</Key>
            </div>
            {loading && (
              <div className="qx-command-status" role="status">
                {strings.loading}
              </div>
            )}
            {!loading && query.trim() !== "" && results.length === 0 && (
              <div className="qx-command-status" role="status">
                {fill(strings.empty, { query: query.trim() })}
              </div>
            )}
            <BaseAutocomplete.List className="qx-command-list" data-slot="command-list">
              {(group: CommandGroup) => (
                <BaseAutocomplete.Group
                  key={group.label}
                  items={group.items as CommandItem[]}
                  className="qx-command-group"
                >
                  <BaseAutocomplete.GroupLabel className="qx-command-group-label">
                    {group.label}
                  </BaseAutocomplete.GroupLabel>
                  <BaseAutocomplete.Collection>
                    {(item: CommandItem) => {
                      const Icon = item.icon;
                      return (
                        <BaseAutocomplete.Item
                          key={item.value}
                          value={item}
                          disabled={item.disabled}
                          className="qx-command-item"
                          data-slot="command-item"
                          onClick={() => choose(item)}
                        >
                          {/* One leading column, as wide as the avatar: labels after an
                              avatar and after an icon start at the same place. */}
                          {(item.avatar || Icon) && (
                            <span
                              className="qx-command-item-leading"
                              data-slot="command-item-leading"
                            >
                              {item.avatar ? (
                                <Avatar
                                  name={item.avatar.name}
                                  size="sm"
                                  decorative
                                  {...(item.avatar.src ? { src: item.avatar.src } : {})}
                                />
                              ) : (
                                Icon && (
                                  <Icon
                                    shape="sharp"
                                    size={16}
                                    aria-hidden
                                    className="qx-command-item-icon"
                                  />
                                )
                              )}
                            </span>
                          )}
                          {/* The meta sits on the label's baseline, not centred on the row. */}
                          <span className="qx-command-body">
                            <span className="qx-command-text">
                              <span className="qx-command-label">{marked(item.label, query)}</span>
                              {item.description && (
                                <span className="qx-command-description">{item.description}</span>
                              )}
                            </span>
                            {item.meta != null && (
                              <span className="qx-command-meta" data-slot="command-item-meta">
                                {item.meta}
                              </span>
                            )}
                          </span>
                          {item.shortcut && (
                            <span className="qx-command-keys">
                              {item.shortcut.map((key) => (
                                <Key key={key}>{key}</Key>
                              ))}
                            </span>
                          )}
                        </BaseAutocomplete.Item>
                      );
                    }}
                  </BaseAutocomplete.Collection>
                </BaseAutocomplete.Group>
              )}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Root>
          <div className="qx-command-footer" aria-hidden>
            <span>
              <Key>↑</Key>
              <Key>↓</Key> {strings.move}
            </span>
            <span>
              <Key>↵</Key> {strings.open}
            </span>
            <span>
              <Key>Esc</Key> {strings.close}
            </span>
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
