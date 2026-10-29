"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import type { CSSProperties, ReactElement, ReactNode, Ref } from "react";
import type { ControlSize } from "../internal/control";
import { cx } from "../internal/cx";
import { usePortalContainer } from "../provider/provider";

/** One option. */
export interface SelectItem<Value> {
  value: Value;
  label: ReactNode;
  disabled?: boolean;
  /**
   * A short fact at the option's end, such as how many records it leaves ("19"): read out with the
   * option, but not shown in the closed trigger, which takes only the label.
   */
  meta?: ReactNode;
}

/** Options under a group label. */
export interface SelectItemGroup<Value> {
  label: ReactNode;
  items: ReadonlyArray<SelectItem<Value>>;
}

export interface SelectProps<Value, Multiple extends boolean | undefined = false>
  extends Omit<BaseSelect.Root.Props<Value, Multiple>, "items" | "children" | "id"> {
  /** The options, flat or in groups. */
  items: ReadonlyArray<SelectItem<Value> | SelectItemGroup<Value>>;
  /** Shown while nothing is chosen. An example, never an instruction ("e.g. Monthly"). */
  placeholder?: ReactNode;
  /**
   * The trigger's height: `lg`, a form field's (default); `md` or `sm` to sit beside the Buttons of
   * that size in a toolbar, such as an editor's paragraph style.
   */
  size?: ControlSize;
  /** The trigger's id. */
  id?: string;
  /** The trigger, which a Field labels. */
  ref?: Ref<HTMLButtonElement>;
  /** Without a Field: the trigger's accessible name. */
  "aria-label"?: string;
  /** Without a Field: the id of the element that names the trigger, e.g. a visible heading. */
  "aria-labelledby"?: string;
  /** The id of an element describing the trigger; inside a Field, its help and error join it. */
  "aria-describedby"?: string;
  /** Placement of the trigger only. */
  className?: string;
  /** Placement of the trigger only, like `className`. */
  style?: CSSProperties;
}

const isGroup = <Value,>(
  entry: SelectItem<Value> | SelectItemGroup<Value>,
): entry is SelectItemGroup<Value> => "items" in entry;

function Option<Value>({ item }: { item: SelectItem<Value> }): ReactElement {
  return (
    <BaseSelect.Item
      value={item.value}
      disabled={item.disabled}
      className="qx-select-option"
      data-slot="select-option"
    >
      <BaseSelect.ItemText className="qx-select-option-text">{item.label}</BaseSelect.ItemText>
      {item.meta != null && (
        <span className="qx-select-option-meta" data-slot="select-option-meta">
          {item.meta}
        </span>
      )}
      <BaseSelect.ItemIndicator className="qx-select-option-check">
        <CheckIcon shape="sharp" size={16} aria-hidden />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

/**
 * Pick one option, or several with `multiple`, from up to about 15. It looks like a field and opens
 * its list below, like a menu. Wrap it in a Field for its label.
 */
export function Select<Value, Multiple extends boolean | undefined = false>({
  items,
  placeholder,
  size = "lg",
  id,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  className,
  style,
  ...props
}: SelectProps<Value, Multiple>): ReactElement {
  const portalContainer = usePortalContainer();
  const flat = items.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]));
  const labelOf = (value: unknown): ReactNode =>
    flat.find((item) => Object.is(item.value, value))?.label;
  return (
    <BaseSelect.Root {...props} id={id} items={flat}>
      <BaseSelect.Trigger
        ref={ref}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={cx("qx-select-trigger", className)}
        style={style}
        data-slot="select-trigger"
        data-size={size}
      >
        <BaseSelect.Value
          className="qx-select-value"
          data-slot="select-value"
          placeholder={placeholder}
        >
          {(value: unknown) =>
            Array.isArray(value)
              ? value.length > 0
                ? value
                    .map(labelOf)
                    .filter((label) => label != null)
                    .join(", ")
                : placeholder
              : (labelOf(value) ?? placeholder)
          }
        </BaseSelect.Value>
        <BaseSelect.Icon className="qx-select-icon">
          <ChevronDownIcon shape="sharp" size={16} aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal container={portalContainer}>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          sideOffset={4}
          className="qx-select-positioner"
        >
          <BaseSelect.Popup className="qx-select-popup" data-slot="select-popup">
            <BaseSelect.List className="qx-select-list">
              {items.map((entry, index) =>
                isGroup(entry) ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: groups have no id; their order is the identity
                  <BaseSelect.Group key={index} className="qx-select-group">
                    <BaseSelect.GroupLabel
                      className="qx-select-group-label"
                      data-slot="select-group-label"
                    >
                      {entry.label}
                    </BaseSelect.GroupLabel>
                    {entry.items.map((item) => (
                      <Option key={String(item.value)} item={item} />
                    ))}
                  </BaseSelect.Group>
                ) : (
                  <Option key={String(entry.value)} item={entry} />
                ),
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
