"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { XIcon } from "@qeetrix/icons/icons/x";
import { type CSSProperties, type ReactElement, type Ref, useMemo } from "react";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

/** What a Combobox stores: an ID, never an object. */
export type ComboboxValue = string | number;

/** One option. */
export interface ComboboxItem<Value extends ComboboxValue> {
  value: Value;
  /** Shown, and matched against what's typed. */
  label: string;
  /** A second, quieter line: an email, a code. */
  description?: string;
  disabled?: boolean;
}

/** Options under a group label. */
export interface ComboboxItemGroup<Value extends ComboboxValue> {
  label: string;
  items: ReadonlyArray<ComboboxItem<Value>>;
}

export interface ComboboxProps<
  Value extends ComboboxValue,
  Multiple extends boolean | undefined = false,
> extends Omit<
    BaseCombobox.Root.Props<Value, Multiple, ComboboxItem<Value>>,
    | "items"
    | "children"
    | "id"
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
  /** Without a Field: the input's accessible name. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Placement of the field only. */
  className?: string;
  style?: CSSProperties;
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["combobox"]>;
}

const isGrouped = <Value extends ComboboxValue>(
  items: ReadonlyArray<ComboboxItem<Value>> | ReadonlyArray<ComboboxItemGroup<Value>>,
): items is ReadonlyArray<ComboboxItemGroup<Value>> =>
  items.length > 0 && "items" in (items[0] as object);

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
        <span className="qx-combobox-option-label">{item.label}</span>
        {item.description && (
          <span className="qx-combobox-option-description">{item.description}</span>
        )}
      </span>
      <BaseCombobox.ItemIndicator className="qx-combobox-option-check">
        <CheckIcon shape="sharp" size={16} aria-hidden />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}

/**
 * Pick from many options by typing to filter (07-components.md): a Select whose list narrows as
 * you type, one value or several (`multiple`). Several show as removable pills in the field:
 * Backspace removes the last, and the arrow keys move between them. Wrap it in a Field.
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
  messages,
  ...props
}: ComboboxProps<Value, Multiple>): ReactElement {
  const strings = useMessages("combobox", messages);
  const grouped = isGrouped(items);
  const flat: ReadonlyArray<ComboboxItem<Value>> = grouped
    ? items.flatMap((group) => group.items)
    : items;
  const labelOf = (value: Value) =>
    flat.find((item) => Object.is(item.value, value))?.label ?? String(value);
  const collection = useMemo(
    () =>
      BaseCombobox.createItems(items as ReadonlyArray<ComboboxItem<Value>>, {
        getValue: (item) => item.value,
        getLabel: (item) => item.label,
      }),
    [items],
  );
  const multiple = props.multiple === true;
  const input = (count: number) => (
    <BaseCombobox.Input
      id={id}
      ref={ref}
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
      {...(props as BaseCombobox.Root.Props<Value, Multiple, ComboboxItem<Value>>)}
      items={collection}
    >
      <BaseCombobox.InputGroup
        className={cx("qx-combobox", className)}
        style={style}
        data-slot="combobox"
        data-multiple={multiple ? "" : undefined}
      >
        {Icon && <Icon shape="sharp" size={16} aria-hidden className="qx-combobox-icon" />}
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
                        aria-label={fill(strings.remove, { label })}
                      >
                        <XIcon shape="sharp" size={12} aria-hidden />
                      </BaseCombobox.ChipRemove>
                    </BaseCombobox.Chip>
                  );
                })}
                {input(value.length)}
              </BaseCombobox.Chips>
            )}
          </BaseCombobox.Value>
        ) : (
          input(0)
        )}
        {!multiple && (
          <BaseCombobox.Clear className="qx-combobox-clear" aria-label={strings.clear}>
            <XIcon shape="sharp" size={14} aria-hidden />
          </BaseCombobox.Clear>
        )}
        <BaseCombobox.Trigger className="qx-combobox-trigger" aria-label={strings.open}>
          <ChevronDownIcon shape="sharp" size={16} aria-hidden />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={4} className="qx-combobox-positioner">
          <BaseCombobox.Popup className="qx-combobox-popup" data-slot="combobox-popup">
            <BaseCombobox.Empty className="qx-combobox-empty">{strings.empty}</BaseCombobox.Empty>
            <BaseCombobox.List className="qx-combobox-list">
              {grouped
                ? (group: ComboboxItemGroup<Value>) => (
                    <BaseCombobox.Group
                      key={group.label}
                      items={group.items as ComboboxItem<Value>[]}
                      className="qx-combobox-group"
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
