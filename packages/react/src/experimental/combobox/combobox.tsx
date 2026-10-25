"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type CSSProperties,
  type ReactElement,
  type Ref,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import { useLabelText } from "../../internal/label-text";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";
import { Spinner } from "../../spinner/spinner";

/** What a Combobox stores: an ID, never an object. */
export type ComboboxValue = string | number;

/** One option. */
export interface ComboboxItem<Value extends ComboboxValue> {
  /** What the Combobox stores and reports when this option is chosen: an ID, e.g. a user's. */
  value: Value;
  /** Shown, and matched against what's typed. */
  label: string;
  /** A second, quieter line: an email, a code. */
  description?: string;
  /** Shown, but can't be chosen. Default `false`. */
  disabled?: boolean;
}

/** Options under a group label. */
export interface ComboboxItemGroup<Value extends ComboboxValue> {
  /** The heading above the group's options, e.g. "Security". */
  label: string;
  /** The options in the group. */
  items: ReadonlyArray<ComboboxItem<Value>>;
}

type RootProps<
  Value extends ComboboxValue,
  Multiple extends boolean | undefined,
> = BaseCombobox.Root.Props<Value, Multiple, ComboboxItem<Value>>;

export interface ComboboxProps<
  Value extends ComboboxValue,
  Multiple extends boolean | undefined = false,
> extends Omit<
    RootProps<Value, Multiple>,
    | "items"
    | "children"
    | "id"
    | "filter"
    | "filteredItems"
    | "grid"
    | "inline"
    | "virtualized"
    | "itemToStringLabel"
    | "itemToStringValue"
    | "isItemEqualToValue"
  > {
  /** The options: all flat, or all in groups. Values are IDs; labels are what's typed against. */
  items: ReadonlyArray<ComboboxItem<Value>> | ReadonlyArray<ComboboxItemGroup<Value>>;
  /** Shown while the field is empty. An example, never an instruction ("e.g. Priya Sharma"). */
  placeholder?: string;
  /** A 16px leading icon from `@qeetrix/icons`, sharp, e.g. search. */
  icon?: QeetrixIcon;
  /** The input's id. */
  id?: string;
  /** The input, which a Field labels. */
  ref?: Ref<HTMLInputElement>;
  /** Without a Field: the input's accessible name, e.g. "Owner". */
  "aria-label"?: string;
  /** Without a Field: the id of the element whose text names the input. */
  "aria-labelledby"?: string;
  /** The ids of elements whose text describes the input, read after its name. */
  "aria-describedby"?: string;
  /** Placement of the field only. */
  className?: string;
  /** Inline style for the field's box: placement only (margin, width, grid placement). */
  style?: CSSProperties;
  /**
   * How an option matches what's typed. `null` shows `items` as given, for options already
   * filtered elsewhere, e.g. by a server. When not set, an option matches when its label contains
   * the text, ignoring case and accents; with `onSearch`, it's `null`.
   */
  filter?: RootProps<Value, Multiple>["filter"];
  /**
   * Search on the server, e.g. a large directory: called with what's typed once typing pauses
   * (`searchDelay`), and with "" at once when the field is cleared; never when choosing an option
   * fills the field in. Pass the results as `items`, with `loading` while they're on the way. A
   * chosen option keeps its label when the results no longer include it.
   */
  onSearch?: (query: string) => void;
  /** How long typing must pause before `onSearch`, in ms. Default `300`. */
  searchDelay?: number;
  /**
   * Results are on the way: the list shows "Searching…", which is announced, instead of
   * "No matches", and is marked busy. Default `false`.
   */
  loading?: boolean;
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["combobox"]>;
}

const isGrouped = <Value extends ComboboxValue>(
  items: ReadonlyArray<ComboboxItem<Value>> | ReadonlyArray<ComboboxItemGroup<Value>>,
): items is ReadonlyArray<ComboboxItemGroup<Value>> =>
  items.length > 0 && "items" in (items[0] as object);

const labelsOf = <Value extends ComboboxValue>(items: ReadonlyArray<ComboboxItem<Value>>) =>
  items.map((item): [Value, string] => [item.value, item.label]);

function Option<Value extends ComboboxValue>({
  item,
}: {
  item: ComboboxItem<Value>;
}): ReactElement {
  return (
    <BaseCombobox.Item
      value={item.value}
      disabled={item.disabled}
      className="qx-combobox-option"
      data-slot="combobox-option"
    >
      <span className="qx-combobox-option-text">
        <span className="qx-combobox-option-label" data-slot="combobox-option-label">
          {item.label}
        </span>
        {item.description && (
          <span className="qx-combobox-option-description" data-slot="combobox-option-description">
            {item.description}
          </span>
        )}
      </span>
      <BaseCombobox.ItemIndicator
        className="qx-combobox-option-check"
        data-slot="combobox-option-check"
      >
        <CheckIcon shape="sharp" size={16} aria-hidden />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}

/**
 * Pick from many options by typing to filter: a Select whose list narrows as you type, one value or
 * several (`multiple`). Several show as removable pills in the field: Backspace removes the last,
 * and the arrow keys move between them. For a directory too large to send whole, `onSearch` asks
 * the server once typing pauses, and `loading` shows the wait. Wrap it in a Field; its Clear button
 * is named after the field's label.
 */
export function Combobox<
  Value extends ComboboxValue,
  Multiple extends boolean | undefined = false,
>({
  items,
  placeholder,
  icon: Icon,
  id,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  className,
  style,
  filter,
  onSearch,
  searchDelay = 300,
  loading = false,
  onInputValueChange,
  messages,
  ...props
}: ComboboxProps<Value, Multiple>): ReactElement {
  const strings = useMessages("combobox", messages);
  const input = useRef<HTMLInputElement>(null);
  const field = useLabelText(input) || ariaLabel;
  const grouped = isGrouped(items);
  const flat: ReadonlyArray<ComboboxItem<Value>> = grouped
    ? items.flatMap((group) => group.items)
    : items;

  // Every option's label seen so far, so a chosen one keeps its label once a search's results
  // replace `items` without it.
  const [seen, setSeen] = useState(items);
  const [labels, setLabels] = useState(() => new Map(labelsOf(flat)));
  if (seen !== items) {
    setSeen(items);
    setLabels((known) => new Map([...known, ...labelsOf(flat)]));
  }
  const labelOf = (value: Value) =>
    flat.find((item) => Object.is(item.value, value))?.label ?? labels.get(value) ?? String(value);

  const collection = useMemo(
    () =>
      BaseCombobox.createItems(items as ReadonlyArray<ComboboxItem<Value>>, {
        getValue: (item) => item.value,
        getLabel: (item) => item.label,
      }),
    [items],
  );

  // Server search: what's typed waits for a pause; `searched` is the last query asked, so clearing
  // an already empty field doesn't ask again.
  const [pending, setPending] = useState<string | null>(null);
  const searched = useRef("");
  const search = useEffectEvent((query: string) => {
    searched.current = query;
    onSearch?.(query);
  });
  useEffect(() => {
    if (pending === null) return;
    const timer = setTimeout(() => {
      setPending(null);
      search(pending);
    }, searchDelay);
    return () => clearTimeout(timer);
  }, [pending, searchDelay]);

  const onInput: RootProps<Value, Multiple>["onInputValueChange"] = (text, details) => {
    if (onSearch) {
      if (details.reason === "input-change") setPending(text);
      else {
        // Choosing fills the field in, and closing tidies it: neither is a search, unless it
        // empties the field.
        setPending(null);
        if (text === "" && searched.current !== "") {
          searched.current = "";
          onSearch("");
        }
      }
    }
    onInputValueChange?.(text, details);
  };

  const multiple = props.multiple === true;
  const inputRef = mergeRefs(ref, input);
  const inputElement = (count: number) => (
    <BaseCombobox.Input
      id={id}
      ref={inputRef}
      placeholder={count === 0 ? placeholder : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      {...(count > 0 ? { "aria-description": fill(strings.selected, { count }) } : {})}
      className="qx-combobox-input"
      data-slot="combobox-input"
    />
  );

  return (
    <BaseCombobox.Root
      {...(props as RootProps<Value, Multiple>)}
      items={collection}
      itemToStringLabel={labelOf}
      filter={filter !== undefined ? filter : onSearch ? null : undefined}
      onInputValueChange={onInput}
    >
      <BaseCombobox.InputGroup
        className={cx("qx-combobox", className)}
        style={style}
        data-slot="combobox"
        data-multiple={multiple ? "" : undefined}
      >
        {Icon && (
          <Icon
            shape="sharp"
            size={16}
            aria-hidden
            className="qx-combobox-icon"
            data-slot="combobox-icon"
          />
        )}
        {multiple ? (
          <BaseCombobox.Value>
            {(value: Value[]) => (
              <BaseCombobox.Chips className="qx-combobox-chips" data-slot="combobox-chips">
                {value.map((selected) => {
                  const label = labelOf(selected);
                  return (
                    <BaseCombobox.Chip
                      key={String(selected)}
                      className="qx-combobox-chip"
                      data-slot="combobox-chip"
                      aria-label={label}
                      aria-description={strings.removeHint}
                    >
                      <span className="qx-combobox-chip-label">{label}</span>
                      <BaseCombobox.ChipRemove
                        className="qx-combobox-chip-remove"
                        data-slot="combobox-chip-remove"
                        aria-label={fill(strings.remove, { label })}
                      >
                        <XIcon shape="sharp" size={12} aria-hidden />
                      </BaseCombobox.ChipRemove>
                    </BaseCombobox.Chip>
                  );
                })}
                {inputElement(value.length)}
              </BaseCombobox.Chips>
            )}
          </BaseCombobox.Value>
        ) : (
          inputElement(0)
        )}
        {!multiple && (
          <BaseCombobox.Clear
            className="qx-combobox-clear"
            data-slot="combobox-clear"
            aria-label={field ? fill(strings.clearFor, { label: field }) : strings.clear}
          >
            <XIcon shape="sharp" size={14} aria-hidden />
          </BaseCombobox.Clear>
        )}
        <BaseCombobox.Trigger
          className="qx-combobox-trigger"
          data-slot="combobox-trigger"
          aria-label={strings.open}
        >
          <ChevronDownIcon shape="sharp" size={16} aria-hidden />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={4} className="qx-combobox-positioner">
          <BaseCombobox.Popup className="qx-combobox-popup" data-slot="combobox-popup">
            <BaseCombobox.Status className="qx-combobox-status" data-slot="combobox-status">
              {loading && (
                <>
                  <Spinner decorative size="sm" />
                  {strings.loading}
                </>
              )}
            </BaseCombobox.Status>
            <BaseCombobox.Empty className="qx-combobox-empty" data-slot="combobox-empty">
              {loading ? null : strings.empty}
            </BaseCombobox.Empty>
            <BaseCombobox.List
              className="qx-combobox-list"
              data-slot="combobox-list"
              aria-busy={loading || undefined}
            >
              {grouped
                ? (group: ComboboxItemGroup<Value>) => (
                    <BaseCombobox.Group
                      key={group.label}
                      items={group.items as ComboboxItem<Value>[]}
                      className="qx-combobox-group"
                      data-slot="combobox-group"
                    >
                      <BaseCombobox.GroupLabel
                        className="qx-combobox-group-label"
                        data-slot="combobox-group-label"
                      >
                        {group.label}
                      </BaseCombobox.GroupLabel>
                      <BaseCombobox.Collection>
                        {(item: ComboboxItem<Value>) => (
                          <Option key={String(item.value)} item={item} />
                        )}
                      </BaseCombobox.Collection>
                    </BaseCombobox.Group>
                  )
                : (item: ComboboxItem<Value>) => <Option key={String(item.value)} item={item} />}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
