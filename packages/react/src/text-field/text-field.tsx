"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { CSSProperties, ReactElement } from "react";
import { FieldMessages, type FieldProps, labelText } from "../field/field";
import { Input, type InputProps } from "../input/input";
import { cx } from "../internal/cx";
import { useMessages } from "../provider/provider";

type FieldOnly = Pick<
  FieldProps,
  | "label"
  | "description"
  | "error"
  | "optional"
  | "hideLabel"
  | "invalid"
  | "validate"
  | "validationMode"
  | "validationDebounceTime"
  | "dirty"
  | "touched"
  | "actionsRef"
  | "messages"
>;

export interface TextFieldProps extends Omit<InputProps, "className" | "style">, FieldOnly {
  /** Placement of the whole row only (margin, width, grid placement). */
  className?: string;
  style?: CSSProperties;
}

/**
 * Field + Input in one: the default way to build a text row (D-12). `name`, `disabled` and
 * validation go to the Field; `ref`, `required`, `readOnly` and every other prop go to the input.
 */
export function TextField({
  label,
  description,
  error,
  optional,
  hideLabel,
  invalid,
  validate,
  validationMode,
  validationDebounceTime,
  dirty,
  touched,
  actionsRef,
  messages,
  name,
  disabled,
  className,
  style,
  ...inputProps
}: TextFieldProps): ReactElement {
  const strings = useMessages("field", messages);
  return (
    <BaseField.Root
      name={name}
      disabled={disabled}
      invalid={invalid ?? (error != null ? true : undefined)}
      validate={validate}
      validationMode={validationMode}
      validationDebounceTime={validationDebounceTime}
      dirty={dirty}
      touched={touched}
      actionsRef={actionsRef}
      className={cx("qx-field", className)}
      style={style}
      data-slot="text-field"
    >
      <BaseField.Label
        className="qx-field-label"
        data-slot="field-label"
        data-hidden={hideLabel ? "" : undefined}
      >
        {labelText(label, optional, strings.optional)}
      </BaseField.Label>
      <Input {...inputProps} />
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
