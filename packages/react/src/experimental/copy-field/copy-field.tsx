"use client";

import { type ComponentProps, type ReactElement, type ReactNode, use, useId } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";
import { CopyButton } from "../copy-button/copy-button";
import { InDescriptionList } from "../description-list/description-list";

export type CopyFieldLayout = "field" | "row";

export interface CopyFieldProps extends Omit<ComponentProps<"div">, "children"> {
  /** Names the value and, through it, the Copy button: "ACS URL" makes "Copy ACS URL". */
  label: ReactNode;
  /** The value: read-only, in code type, selected whole by one click. */
  value: string;
  /** A line under the value, on where it goes: "Paste it into your identity provider." */
  description?: ReactNode;
  /**
   * `field`, a read-only field (the label above); `row`, a fact row on a record page (the label,
   * the value, Copy at the end), lining up with DescriptionItem. Default `field`. Inside a
   * DescriptionList it's always one of the list's items, whatever the layout.
   */
  layout?: CopyFieldLayout;
  /** `anywhere`: a long value breaks onto more lines; `none`: it stays on one. Default `anywhere`. */
  wrap?: "anywhere" | "none";
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["copyField"]>;
}

/**
 * A read-only value with its Copy button: an ID, a URL to paste elsewhere, a secret shown once. The
 * value is in code type and wraps rather than scrolls; one click selects it whole; the Copy button
 * is named after the label and says "Copied" politely. Inside a DescriptionList it's one of its
 * items, so values to copy and plain facts share one list and one ruled sheet: the label is the
 * term, the value the description, and Copy sits at the row's end, as a DescriptionItem's action.
 */
export function CopyField({
  label,
  value,
  description,
  layout = "field",
  wrap = "anywhere",
  messages,
  className,
  ...props
}: CopyFieldProps): ReactElement {
  const strings = useMessages("copyField", messages);
  const id = useId();
  const inList = use(InDescriptionList);
  const copy = (
    <CopyButton
      value={value}
      label={typeof label === "string" ? fill(strings.copy, { label }) : strings.copyPlain}
      size="sm"
    />
  );
  const code = (
    <code className="qx-copy-field-value" data-slot="copy-field-value">
      {value}
    </code>
  );
  if (inList)
    return (
      <div
        {...props}
        className={cx("qx-description-item qx-copy-field-item", className)}
        data-slot="copy-field"
        data-layout={layout}
        data-wrap={wrap}
        data-action=""
      >
        <dt className="qx-description-term" data-slot="description-term">
          {label}
        </dt>
        <dd className="qx-description-value" data-slot="description-value">
          {code}
          {description != null && (
            <span className="qx-description-note" data-slot="description-note">
              {description}
            </span>
          )}
        </dd>
        <dd className="qx-description-action" data-slot="description-action">
          {copy}
        </dd>
      </div>
    );
  return (
    // biome-ignore lint/a11y/useSemanticElements: a read-only value and its action, not a form fieldset
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={description != null ? `${id}-description` : undefined}
      {...props}
      className={cx("qx-copy-field", className)}
      data-slot="copy-field"
      data-layout={layout}
      data-wrap={wrap}
    >
      <span id={`${id}-label`} className="qx-copy-field-label" data-slot="copy-field-label">
        {label}
      </span>
      <span className="qx-copy-field-box" data-slot="copy-field-box">
        {code}
        {copy}
      </span>
      {description != null && (
        <span
          id={`${id}-description`}
          className="qx-copy-field-description"
          data-slot="copy-field-description"
        >
          {description}
        </span>
      )}
    </div>
  );
}
