"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { MinusIcon } from "@qeetrix/icons/icons/minus";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import type { CSSProperties, ReactElement, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useLocale, useMessages } from "../../provider/provider";

export interface NumberFieldProps
  extends Omit<BaseNumberField.Root.Props, "className" | "style" | "render" | "children"> {
  /** Before the value: a unit such as ₹. */
  startAdornment?: ReactNode;
  /** After the value: a unit such as "minutes" or %. */
  endAdornment?: ReactNode;
  /** The − and + buttons at the end. Default `true`; turn them off for amounts nobody steps through. */
  steppers?: boolean;
  /** Shown while empty: an example ("e.g. 30"). */
  placeholder?: string;
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
  messages?: Partial<QeetrixMessages["numberField"]>;
}

/**
 * A number (07-components.md), on Base UI's Number Field: typed, or stepped with the − and +
 * buttons, the arrow keys (Shift or Page Up/Down for big steps), Home and End for `min` and `max`.
 * It formats for the locale (en-IN groups in lakhs) and takes `format` for currency or percent.
 * The same field as Input. Wrap it in a Field.
 */
export function NumberField({
  startAdornment,
  endAdornment,
  steppers = true,
  placeholder,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  locale: localeProp,
  className,
  style,
  messages,
  ...props
}: NumberFieldProps): ReactElement {
  const strings = useMessages("numberField", messages);
  const provided = useLocale();
  return (
    <BaseNumberField.Root {...props} locale={localeProp ?? provided}>
      <BaseNumberField.Group
        className={cx("qx-number-field", className)}
        style={style}
        data-slot="number-field"
      >
        {startAdornment != null && (
          <span className="qx-number-field-adornment" data-slot="number-field-start">
            {startAdornment}
          </span>
        )}
        <BaseNumberField.Input
          ref={ref}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-roledescription={strings.roleDescription}
          className="qx-number-field-input"
          data-slot="number-field-input"
        />
        {endAdornment != null && (
          <span className="qx-number-field-adornment" data-slot="number-field-end">
            {endAdornment}
          </span>
        )}
        {steppers && (
          <span className="qx-number-field-steppers">
            <BaseNumberField.Decrement
              className="qx-number-field-step"
              aria-label={strings.decrement}
              data-slot="number-field-decrement"
            >
              <MinusIcon shape="sharp" size={16} aria-hidden />
            </BaseNumberField.Decrement>
            <BaseNumberField.Increment
              className="qx-number-field-step"
              aria-label={strings.increment}
              data-slot="number-field-increment"
            >
              <PlusIcon shape="sharp" size={16} aria-hidden />
            </BaseNumberField.Increment>
          </span>
        )}
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
