"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { type CSSProperties, type ReactElement, type ReactNode, use, useId } from "react";
import { FieldMessages, InFieldContext } from "../field/field";
import { cx } from "../internal/cx";
import type { QeetrixMessages } from "../internal/messages";
import { fill } from "../internal/template";
import { useLocale, useMessages } from "../provider/provider";

export interface SliderProps<Value extends number | readonly number[] = number>
  extends Omit<BaseSlider.Root.Props<Value>, "className" | "style" | "children"> {
  /** The visible label. Without one, give the slider an `aria-label`. */
  label?: ReactNode;
  /**
   * Help text under the slider, e.g. what the range means. Hidden while an error shows. Inside a
   * Field, use the Field's own.
   */
  description?: ReactNode;
  /**
   * An error to show now, e.g. from the server; it also marks the slider invalid. Without it, a
   * Form's server error for its `name` shows. Inside a Field, use the Field's own.
   */
  error?: ReactNode;
  /**
   * Show the formatted value at the end of the header, in `locale` (default: QeetrixProvider's).
   * Default `false`.
   */
  showValue?: boolean;
  /**
   * What a screen reader says for a thumb's value where the number alone means little: a position
   * on a log scale, or a value with its unit ("25,000 monthly active users"). It gets the formatted
   * value, the value and the thumb's index, so a range can say each end. Default: the formatted
   * value.
   */
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string;
  /** A range's thumb names, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["slider"]>;
  /** Placement only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
}

/** A catalogue template with its `{label}` slot filled by any node, not only text. */
function fillNode(template: string, label: ReactNode): ReactNode {
  const [before, ...after] = template.split("{label}");
  return (
    <>
      {before}
      {label}
      {after.join("{label}")}
    </>
  );
}

/**
 * A number, or a range, on a continuous scale. An array value renders one thumb per value, each
 * named after the label ("Amount, minimum"). Arrow keys step, Page Up and Down take `largeStep`,
 * Home and End jump. On its own it's a field, with a `description` and an `error` like the choice
 * groups; inside a Field, the Field supplies them.
 */
export function Slider<Value extends number | readonly number[] = number>({
  label,
  description,
  error,
  showValue,
  getAriaValueText,
  messages,
  "aria-label": ariaLabel,
  locale,
  className,
  style,
  value,
  defaultValue,
  ...props
}: SliderProps<Value>): ReactElement {
  const strings = useMessages("slider", messages);
  const providerLocale = useLocale();
  const id = useId();
  const initial = value ?? defaultValue;
  const thumbs = Array.isArray(initial) ? initial.length : 1;
  const range = thumbs > 1;
  // Always a field of its own outside a Field, so an error arriving later doesn't remount it.
  const field = !use(InFieldContext);
  // What a range's thumbs are named after: the aria-label, or a label that is plain text. A label
  // that isn't text names them through hidden copies of the template instead.
  const name = ariaLabel ?? (typeof label === "string" ? label : undefined);
  const boundOf = (index: number) => (index === 0 ? strings.minimumOf : strings.maximumOf);
  const namedByNode = range && name === undefined && label != null;
  const thumbName = (index: number) =>
    name === undefined
      ? index === 0
        ? strings.minimum
        : strings.maximum
      : fill(boundOf(index), { label: name });
  const slider = (
    <BaseSlider.Root
      {...props}
      aria-label={ariaLabel}
      value={value}
      defaultValue={defaultValue}
      locale={locale ?? providerLocale}
      className={cx("qx-slider", field ? undefined : className)}
      style={field ? undefined : style}
      data-slot="slider"
    >
      {(label != null || showValue) && (
        <div className="qx-slider-header" data-slot="slider-header">
          {label != null && (
            <BaseSlider.Label className="qx-slider-label" data-slot="slider-label">
              {label}
            </BaseSlider.Label>
          )}
          {showValue && <BaseSlider.Value className="qx-slider-value" data-slot="slider-value" />}
        </div>
      )}
      <BaseSlider.Control className="qx-slider-control" data-slot="slider-control">
        <BaseSlider.Track className="qx-slider-track" data-slot="slider-track">
          <BaseSlider.Indicator className="qx-slider-indicator" data-slot="slider-indicator" />
          {Array.from({ length: thumbs }, (_, index) => (
            <BaseSlider.Thumb
              // biome-ignore lint/suspicious/noArrayIndexKey: a thumb is its index
              key={index}
              index={index}
              // A visible label names a single thumb through Base UI; an aria-label is passed on,
              // since the thumb, not the group, has the slider role. A range's thumbs are each
              // named after the label: "Amount, minimum".
              getAriaLabel={
                range ? (namedByNode ? null : thumbName) : ariaLabel ? () => ariaLabel : null
              }
              aria-labelledby={namedByNode ? `${id}-thumb-${index}` : undefined}
              getAriaValueText={getAriaValueText}
              className="qx-slider-thumb"
              data-slot="slider-thumb"
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
      {namedByNode &&
        Array.from({ length: thumbs }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: one name per thumb, by index
          <span key={index} id={`${id}-thumb-${index}`} hidden>
            {fillNode(boundOf(index), label)}
          </span>
        ))}
    </BaseSlider.Root>
  );
  if (!field) return slider;
  return (
    <BaseField.Root
      name={props.name}
      disabled={props.disabled}
      invalid={error != null ? true : undefined}
      className={cx("qx-field qx-slider-field", className)}
      style={style}
      data-slot="slider-field"
    >
      {slider}
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
