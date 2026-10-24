"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { type CSSProperties, type ReactElement, type ReactNode, use } from "react";
import { cx } from "../internal/cx";
import { type FieldMessageProps, FieldMessages, InFieldContext } from "./field";

/**
 * How a checkbox, radio or switch is named: by its visible `label`, or — with no visible label, as
 * in a table row — by `aria-label` or `aria-labelledby`, which the type then requires.
 */
export type ChoiceLabelProps =
  | { label: ReactNode; "aria-label"?: string; "aria-labelledby"?: string }
  | { label?: undefined; "aria-label": string; "aria-labelledby"?: string }
  | { label?: undefined; "aria-label"?: string; "aria-labelledby": string };

/** Options stacked (`vertical`) or in a wrapping row (`horizontal`, for short options). */
export type ChoiceOrientation = "vertical" | "horizontal";

type Kind = "checkbox" | "radio" | "switch";

interface ChoiceRowProps {
  kind: Kind;
  label: ReactNode;
  description: ReactNode;
  disabled: boolean | undefined;
  className: string | undefined;
  style: CSSProperties | undefined;
  /** The control. */
  children: ReactElement;
}

/**
 * One option: the control and its text inside a label (the whole row is the click target), then an
 * optional description, both linked to the control by Base UI. Inside a group or a Field the row is
 * a Field.Item; on its own it is a Field.Root. With no visible label, the control renders alone.
 */
export function ChoiceRow({
  kind,
  label,
  description,
  disabled,
  className,
  style,
  children,
}: ChoiceRowProps): ReactElement {
  const inField = use(InFieldContext);
  if (label == null) return children;
  const row = {
    disabled,
    className: cx("qx-choice", className),
    style,
    "data-slot": kind,
    children: (
      <>
        <BaseField.Label className="qx-choice-label" data-slot={`${kind}-label`}>
          {children}
          <span className="qx-choice-text">{label}</span>
        </BaseField.Label>
        {description != null && (
          <BaseField.Description
            className="qx-choice-description"
            data-slot={`${kind}-description`}
          >
            {description}
          </BaseField.Description>
        )}
      </>
    ),
  };
  return inField ? <BaseField.Item {...row} /> : <BaseField.Root {...row} />;
}

interface ChoiceGroupProps extends FieldMessageProps {
  kind: "checkbox" | "radio";
  label: ReactNode;
  name: string | undefined;
  disabled: boolean | undefined;
  orientation: ChoiceOrientation;
  className: string | undefined;
  style: CSSProperties | undefined;
  /** The Base UI group element the fieldset renders as. */
  group: ReactElement;
  children: ReactNode;
}

/** A question with options: Field › Fieldset rendered as the group › legend, options, messages. */
export function ChoiceGroup({
  kind,
  label,
  description,
  error,
  name,
  disabled,
  orientation,
  className,
  style,
  group,
  children,
}: ChoiceGroupProps): ReactElement {
  return (
    <BaseField.Root
      name={name}
      disabled={disabled}
      invalid={error != null ? true : undefined}
      className={cx("qx-field qx-choice-group", className)}
      style={style}
      data-slot={`${kind}-group`}
      data-orientation={orientation}
    >
      <BaseFieldset.Root render={group} className="qx-choice-group-set">
        <BaseFieldset.Legend className="qx-field-label" data-slot={`${kind}-group-legend`}>
          {label}
        </BaseFieldset.Legend>
        <div className="qx-choice-group-options">
          <InFieldContext value>{children}</InFieldContext>
        </div>
      </BaseFieldset.Root>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
