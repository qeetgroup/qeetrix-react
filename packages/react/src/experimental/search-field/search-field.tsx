"use client";

import { SearchIcon } from "@qeetrix/icons/icons/search";
import { XIcon } from "@qeetrix/icons/icons/x";
import { type ReactElement, useEffect, useEffectEvent, useRef, useState } from "react";
import { IconButton } from "../../button/button";
import { Input, type InputProps } from "../../input/input";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { useMessages } from "../../provider/provider";

export interface SearchFieldProps
  extends Omit<InputProps, "type" | "icon" | "value" | "defaultValue" | "onValueChange"> {
  /** The text, controlled. */
  value?: string;
  /** The text when uncontrolled. Default `""`. */
  defaultValue?: string;
  /** Called on every keystroke. */
  onValueChange?: (value: string) => void;
  /** Run the search: when typing pauses, on Enter, and with "" when cleared. */
  onSearch?: (value: string) => void;
  /** How long typing must pause before `onSearch`, in ms. Default `300`. */
  searchDelay?: number;
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["searchField"]>;
}

/**
 * A search box for a list: the Input box with a search icon, `type="search"` (a searchbox), and a
 * Clear search button while there's text. Escape clears it, and only then lets the key through.
 * `onSearch` runs when typing pauses (`searchDelay`), at once on Enter, and with "" when cleared, so
 * a server-searched list asks once per pause, not per key.
 */
export function SearchField({
  value,
  defaultValue = "",
  onValueChange,
  onSearch,
  searchDelay = 300,
  messages,
  disabled,
  readOnly,
  endAdornment,
  ref,
  onKeyDown,
  className,
  ...props
}: SearchFieldProps): ReactElement {
  const strings = useMessages("searchField", messages);
  const input = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  // The text that's waiting for typing to pause; `null` once it has been searched.
  const [pending, setPending] = useState<string | null>(null);

  const search = useEffectEvent((query: string) => onSearch?.(query));
  useEffect(() => {
    if (pending === null) return;
    const timer = setTimeout(() => {
      setPending(null);
      search(pending);
    }, searchDelay);
    return () => clearTimeout(timer);
  }, [pending, searchDelay]);

  const change = (next: string, now: boolean) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
    if (now) {
      setPending(null);
      onSearch?.(next);
    } else setPending(next);
  };

  return (
    <Input
      {...props}
      ref={mergeRefs(ref, input)}
      type="search"
      icon={SearchIcon}
      value={text}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={props.autoComplete ?? "off"}
      className={className ? `qx-search-field ${className}` : "qx-search-field"}
      onValueChange={(next) => change(next, false)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          setPending(null);
          onSearch?.(text);
        }
        if (event.key === "Escape" && text !== "" && !readOnly) {
          event.preventDefault();
          event.stopPropagation();
          change("", true);
        }
        onKeyDown?.(event);
      }}
      endAdornment={
        <>
          {endAdornment}
          {text !== "" && !disabled && !readOnly && (
            <IconButton
              icon={XIcon}
              aria-label={strings.clear}
              size="sm"
              tone="neutral"
              tooltip={false}
              onClick={() => {
                change("", true);
                input.current?.focus();
              }}
              className="qx-search-field-clear"
            />
          )}
        </>
      }
    />
  );
}
