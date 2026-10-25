"use client";

import { Meter as BaseMeter } from "@base-ui/react/meter";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";

interface BarLook {
  /** The visible label. Without one, give it an `aria-label`. */
  label?: ReactNode;
  /** Show the formatted value at the end of the header. */
  showValue?: boolean;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
}

export interface ProgressProps
  extends Omit<BaseProgress.Root.Props, "className" | "style" | "children">,
    BarLook {}

export type MeterTone = "brand" | "success" | "warning" | "danger";

export interface MeterProps
  extends Omit<BaseMeter.Root.Props, "className" | "style" | "children">,
    BarLook {
  /** The indicator's colour. Default `brand`. */
  tone?: MeterTone;
}

/**
 * A task advancing, such as an upload (06-component-specs.md, increment 6). `value={null}` is
 * indeterminate: a segment slides along the track, and fades instead under reduced motion.
 */
export function Progress({ label, showValue, className, ...props }: ProgressProps): ReactElement {
  return (
    <BaseProgress.Root {...props} className={cx("qx-progress", className)} data-slot="progress">
      {(label != null || showValue) && (
        <div className="qx-progress-header" data-slot="progress-header">
          {label != null && (
            <BaseProgress.Label className="qx-progress-label">{label}</BaseProgress.Label>
          )}
          {showValue && <BaseProgress.Value className="qx-progress-value" />}
        </div>
      )}
      <BaseProgress.Track className="qx-progress-track" data-slot="progress-track">
        <BaseProgress.Indicator className="qx-progress-indicator" data-slot="progress-indicator" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

/** A measurement within a range, such as storage used. It looks like Progress; it isn't a task. */
export function Meter({
  label,
  showValue,
  tone = "brand",
  className,
  ...props
}: MeterProps): ReactElement {
  return (
    <BaseMeter.Root
      {...props}
      className={cx("qx-progress", className)}
      data-slot="meter"
      data-tone={tone}
    >
      {(label != null || showValue) && (
        <div className="qx-progress-header" data-slot="meter-header">
          {label != null && (
            <BaseMeter.Label className="qx-progress-label">{label}</BaseMeter.Label>
          )}
          {showValue && <BaseMeter.Value className="qx-progress-value" />}
        </div>
      )}
      <BaseMeter.Track className="qx-progress-track" data-slot="meter-track">
        <BaseMeter.Indicator className="qx-progress-indicator" data-slot="meter-indicator" />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
