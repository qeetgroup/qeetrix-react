"use client";

import { Meter as BaseMeter } from "@base-ui/react/meter";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";
import { useLocale } from "../provider/provider";

interface BarLook {
  /** The visible label. Without one, give it an `aria-label`. */
  label?: ReactNode;
  /** Show the formatted value at the end of the header. */
  showValue?: boolean;
  /** The lowest value: an empty track. Default `0`. */
  min?: number | undefined;
  /** The highest value: a full track. Default `100`. */
  max?: number | undefined;
  /**
   * How the value is written in the header and read out: `Intl.NumberFormat` options for the value
   * itself, e.g. `{ style: "unit", unit: "gigabyte" }`. Default: its percentage of the range.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /** Default: QeetrixProvider's locale. It formats the value. */
  locale?: Intl.LocalesArgument | undefined;
  /** Placement only. */
  className?: string;
  /** Placement only. */
  style?: CSSProperties;
}

/** The indicator's colour while a task advances: `success` once it's done, `danger` if it failed. */
export type ProgressTone = "brand" | "success" | "danger";

export interface ProgressProps
  extends Omit<
      BaseProgress.Root.Props,
      "className" | "style" | "children" | "value" | "min" | "max" | "format" | "locale"
    >,
    BarLook {
  /** How far the task has got, from `min` to `max`; `null` while that's unknown (indeterminate). */
  value: number | null;
  /** The indicator's colour: `success` for a task that finished, `danger` for one that failed. Default `brand`. */
  tone?: ProgressTone;
}

/** The indicator's colour, as Badge's tones. */
export type MeterTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

export interface MeterProps
  extends Omit<
      BaseMeter.Root.Props,
      "className" | "style" | "children" | "value" | "min" | "max" | "format" | "locale"
    >,
    BarLook {
  /** The measurement, from `min` to `max`: storage used, a quota spent. */
  value: number;
  /**
   * The indicator's colour: `neutral` or `info` for a plain amount, `success`, `warning` or `danger`
   * for how it stands. Default `brand`.
   */
  tone?: MeterTone;
}

/**
 * A task advancing, such as an upload. `value={null}` is indeterminate: a segment slides along the
 * track, and fades instead under reduced motion. `tone` marks how it ended.
 */
export function Progress({
  label,
  showValue,
  tone = "brand",
  locale,
  className,
  ...props
}: ProgressProps): ReactElement {
  const providerLocale = useLocale();
  return (
    <BaseProgress.Root
      {...props}
      locale={locale ?? providerLocale}
      className={cx("qx-progress", className)}
      data-slot="progress"
      data-tone={tone}
    >
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
  locale,
  className,
  ...props
}: MeterProps): ReactElement {
  const providerLocale = useLocale();
  return (
    <BaseMeter.Root
      {...props}
      locale={locale ?? providerLocale}
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
