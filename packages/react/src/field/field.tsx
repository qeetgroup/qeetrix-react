"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CircleQuestionMarkIcon } from "@qeetrix/icons/icons/circle-question-mark";
import {
  type ComponentProps,
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
} from "react";
import { IconButton } from "../button/button";
import { cx } from "../internal/cx";
import type { QeetrixMessages } from "../internal/messages";
import { fill } from "../internal/template";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";
import { useMessages } from "../provider/provider";

/**
 * True inside a Field or a choice group. A checkbox, radio or switch there is an item of that field
 * (Base UI Field.Item); on its own it is a field of its own (Field.Root).
 */
export const InFieldContext: Context<boolean> = createContext(false);

/** The help text and error every labelled field shares. */
export interface FieldMessageProps {
  /** Help text under the control, e.g. a format ("15 characters"). Hidden while an error shows. */
  description?: ReactNode;
  /**
   * An error to show now, e.g. from the server; it also marks the field invalid. Without it, the
   * browser's or `validate`'s message shows whenever the field is invalid.
   */
  error?: ReactNode;
}

export interface FieldProps
  extends Omit<BaseField.Root.Props, "className" | "style" | "render" | "children">,
    FieldMessageProps {
  /** The label. Required: a placeholder is never a label. */
  label: ReactNode;
  /** Appends "(optional)". Qeetrix marks optional fields, never required ones. */
  optional?: boolean;
  /** Hides the label visually and keeps it for assistive technology. Only for a toolbar search. */
  hideLabel?: boolean;
  /**
   * A short explanation behind an ⓘ button after the label, for a setting that needs one ("How
   * long an access token stays valid"). It opens in a popover titled with the label, so it can hold
   * a link. Keep what everyone needs in `description`.
   */
  help?: ReactNode;
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["field"]>;
  /** Placement only (margin, width, grid placement). */
  className?: string;
  style?: CSSProperties;
  /** The control: an Input, a Textarea, or any Base UI form control. */
  children?: ReactNode;
}

function ErrorRow({ children, ...props }: ComponentProps<"div">): ReactElement {
  return (
    <div {...props}>
      <CircleAlertIcon shape="sharp" size={16} aria-hidden className="qx-field-error-icon" />
      <span>{children}</span>
    </div>
  );
}

/** The description and error under a control; Base UI links both to it with aria-describedby. */
export function FieldMessages({ description, error }: FieldMessageProps): ReactElement {
  return (
    <>
      {description != null && (
        <BaseField.Description className="qx-field-description" data-slot="field-description">
          {description}
        </BaseField.Description>
      )}
      {/* Without explicit children, Base UI fills in the validation or server message. */}
      <BaseField.Error
        className="qx-field-error"
        data-slot="field-error"
        match={error != null ? true : undefined}
        render={<ErrorRow />}
        {...(error != null ? { children: error } : {})}
      />
    </>
  );
}

/** The label text, with "(optional)" when the field may be left empty. */
export function labelText(
  label: ReactNode,
  optional: boolean | undefined,
  optionalText: string,
): ReactNode {
  if (!optional) return label;
  return (
    <>
      {label}{" "}
      <span className="qx-field-optional" data-slot="field-optional">
        {optionalText}
      </span>
    </>
  );
}

/**
 * The label, help text and error for one control (06-component-specs.md §2), with an optional ⓘ
 * for a longer explanation (07-components.md, Field help).
 */
export function Field({
  label,
  description,
  error,
  optional,
  hideLabel,
  help,
  invalid,
  messages,
  className,
  children,
  ...props
}: FieldProps): ReactElement {
  const strings = useMessages("field", messages);
  const fieldLabel = (
    <BaseField.Label
      className="qx-field-label"
      data-slot="field-label"
      data-hidden={hideLabel ? "" : undefined}
    >
      {labelText(label, optional, strings.optional)}
    </BaseField.Label>
  );
  return (
    <BaseField.Root
      {...props}
      invalid={invalid ?? (error != null ? true : undefined)}
      className={cx("qx-field", className)}
      data-slot="field"
    >
      {help == null ? (
        fieldLabel
      ) : (
        <div className="qx-field-label-row" data-slot="field-label-row">
          {fieldLabel}
          <Popover>
            <PopoverTrigger
              render={
                <IconButton
                  icon={CircleQuestionMarkIcon}
                  aria-label={
                    typeof label === "string" ? fill(strings.help, { label }) : strings.helpPlain
                  }
                  size="sm"
                  tone="neutral"
                  tooltip={false}
                  className="qx-field-help"
                />
              }
            />
            <PopoverContent title={label} side="inline-end" align="start" data-slot="field-help">
              {help}
            </PopoverContent>
          </Popover>
        </div>
      )}
      <InFieldContext value>{children}</InFieldContext>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
