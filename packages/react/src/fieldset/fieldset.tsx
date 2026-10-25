"use client";

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { type CSSProperties, type ReactElement, type ReactNode, useId } from "react";
import { cx } from "../internal/cx";

export interface FieldsetProps
  extends Omit<BaseFieldset.Root.Props, "className" | "style" | "children"> {
  /** The section's heading, e.g. "Billing address". */
  legend: ReactNode;
  /** A line under the legend. It describes the group, so it's read on entering the section. */
  description?: ReactNode;
  /** Placement only (margin, width, grid placement). */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
  /** The fields, stacked with the density's form gap. */
  children?: ReactNode;
}

/**
 * A section of fields under a heading. `disabled` disables every field inside. A choice question is
 * a CheckboxGroup or RadioGroup, not a Fieldset.
 */
export function Fieldset({
  legend,
  description,
  className,
  children,
  "aria-describedby": ariaDescribedBy,
  ...props
}: FieldsetProps): ReactElement {
  const descriptionId = useId();
  const describedBy =
    [ariaDescribedBy, description != null ? descriptionId : undefined].filter(Boolean).join(" ") ||
    undefined;
  return (
    <BaseFieldset.Root
      {...props}
      aria-describedby={describedBy}
      className={cx("qx-fieldset", className)}
      data-slot="fieldset"
    >
      <div className="qx-fieldset-header">
        <BaseFieldset.Legend className="qx-fieldset-legend" data-slot="fieldset-legend">
          {legend}
        </BaseFieldset.Legend>
        {description != null && (
          <p
            id={descriptionId}
            className="qx-fieldset-description"
            data-slot="fieldset-description"
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </BaseFieldset.Root>
  );
}
