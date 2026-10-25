"use client";

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";

export interface FieldsetProps
  extends Omit<BaseFieldset.Root.Props, "className" | "style" | "children"> {
  /** The section's heading, e.g. "Billing address". */
  legend: ReactNode;
  /** A line under the legend. */
  description?: ReactNode;
  /** Placement only (margin, width, grid placement). */
  className?: string;
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
  ...props
}: FieldsetProps): ReactElement {
  return (
    <BaseFieldset.Root {...props} className={cx("qx-fieldset", className)} data-slot="fieldset">
      <div className="qx-fieldset-header">
        <BaseFieldset.Legend className="qx-fieldset-legend" data-slot="fieldset-legend">
          {legend}
        </BaseFieldset.Legend>
        {description != null && (
          <p className="qx-fieldset-description" data-slot="fieldset-description">
            {description}
          </p>
        )}
      </div>
      {children}
    </BaseFieldset.Root>
  );
}
