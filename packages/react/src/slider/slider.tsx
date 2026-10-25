"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";
import { messages } from "../internal/messages";

export interface SliderProps<Value extends number | readonly number[] = number>
  extends Omit<BaseSlider.Root.Props<Value>, "className" | "style" | "children"> {
  /** The visible label. Without one, give the slider an `aria-label`. */
  label?: ReactNode;
  /** Show the formatted value at the end of the header. */
  showValue?: boolean;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
}

/**
 * A number, or a range, on a continuous scale (06-component-specs.md, increment 5). An array value
 * renders one thumb per value. Arrow keys step, Page Up and Down take `largeStep`, Home and End jump.
 */
export function Slider<Value extends number | readonly number[] = number>({
  label,
  showValue,
  className,
  value,
  defaultValue,
  ...props
}: SliderProps<Value>): ReactElement {
  const initial = value ?? defaultValue;
  const thumbs = Array.isArray(initial) ? initial.length : 1;
  const range = thumbs > 1;
  return (
    <BaseSlider.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      className={cx("qx-slider", className)}
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
              getAriaLabel={
                range ? (i) => (i === 0 ? messages.slider.minimum : messages.slider.maximum) : null
              }
              className="qx-slider-thumb"
              data-slot="slider-thumb"
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
