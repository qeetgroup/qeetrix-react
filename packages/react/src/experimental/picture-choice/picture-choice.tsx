"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";

export type PictureChoiceSize = "md" | "lg";
export type PictureChoiceShape = "round" | "square";

export interface PictureChoiceGroupProps {
  /** The options: `PictureChoice`s. */
  children?: ReactNode;
  /** The chosen value, for a controlled group; `null` for none. */
  value?: string | null;
  /** The value chosen at first, for an uncontrolled group. */
  defaultValue?: string | null;
  /** Called with the chosen value and Base UI's event details. */
  onValueChange?: (value: string, details: BaseRadioGroup.ChangeEventDetails) => void;
  /** Names the group: "Avatar". Required unless `aria-labelledby` names it. */
  "aria-label"?: string;
  /** The id of the element that names the group, as `aria-label`. */
  "aria-labelledby"?: string;
  /** A grid of this many columns. Without it the options sit in a row that wraps. */
  columns?: number;
  /** `round` for people (avatars), `square` for anything else: backgrounds, stickers. Default `round`. */
  shape?: PictureChoiceShape;
  /** `md` 48px (default) or `lg` 64px. */
  size?: PictureChoiceSize;
  /** Submits the chosen value with a form under this name. */
  name?: string;
  /** Makes every option unavailable. */
  disabled?: boolean;
  /** Placement only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
}

export interface PictureChoiceProps {
  /** What's chosen. */
  value: string;
  /** Its name, read out and shown on hover: "Fox", "Teal". Required: a picture alone has no name. */
  label: string;
  /** The picture: an image URL. */
  src?: string;
  /** A colour swatch instead of a picture: any CSS colour, or a token's variable. */
  color?: string;
  /** Makes this option unavailable. */
  disabled?: boolean;
}

/**
 * One choice among pictures: an avatar, a background colour, a sticker. A radio group:
 * Tab reaches the chosen picture, the arrow keys move and choose, and every option is named by its
 * `label`. Chosen, a picture is ringed in Ember and ticked at its corner, in light and dark and in
 * forced colours. Pictures in a grid (`columns`) or a wrapping row, round or square.
 *
 * ```tsx
 * <PictureChoiceGroup aria-label="Avatar" columns={4} defaultValue="fox">
 *   <PictureChoice value="fox" label="Fox" src="/avatars/fox.png" />
 *   <PictureChoice value="owl" label="Owl" src="/avatars/owl.png" />
 * </PictureChoiceGroup>
 * <PictureChoiceGroup aria-label="Background" shape="square" defaultValue="teal">
 *   <PictureChoice value="teal" label="Teal" color="#0f766e" />
 *   <PictureChoice value="sand" label="Sand" color="#e7d8b9" />
 * </PictureChoiceGroup>
 * ```
 */
export function PictureChoiceGroup({
  children,
  value,
  defaultValue,
  onValueChange,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  columns,
  shape = "round",
  size = "md",
  name,
  disabled,
  className,
  style,
}: PictureChoiceGroupProps): ReactElement {
  // A field of its own, each option an item in it, as ColorSwatchGroup does: inside a Field, Base UI
  // would otherwise give its radios that field's id, name and label.
  return (
    <BaseField.Root render={<span className="qx-picture-choice-field" />}>
      <BaseRadioGroup
        aria-label={label}
        aria-labelledby={labelledBy}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        onValueChange={(next, details) => onValueChange?.(String(next), details)}
        {...(name !== undefined ? { name } : {})}
        disabled={disabled}
        className={cx("qx-picture-choices", className)}
        style={
          columns !== undefined
            ? ({ "--qx-picture-choice-columns": columns, ...style } as CSSProperties)
            : style
        }
        data-slot="picture-choice-group"
        data-shape={shape}
        data-size={size}
        data-layout={columns !== undefined ? "grid" : "row"}
      >
        {children}
      </BaseRadioGroup>
    </BaseField.Root>
  );
}

/** An option of a PictureChoiceGroup: a picture (`src`) or a colour swatch (`color`), and its name. */
export function PictureChoice({
  value,
  label,
  src,
  color,
  disabled,
}: PictureChoiceProps): ReactElement {
  return (
    <BaseField.Item render={<span className="qx-picture-choice-item" />}>
      <BaseRadio.Root
        value={value}
        disabled={disabled}
        aria-label={label}
        title={label}
        className="qx-picture-choice"
        data-slot="picture-choice"
        data-kind={src !== undefined ? "image" : "color"}
        style={
          color !== undefined
            ? ({ "--qx-picture-choice-color": color } as CSSProperties)
            : undefined
        }
      >
        {src !== undefined && (
          <img
            className="qx-picture-choice-image"
            data-slot="picture-choice-image"
            src={src}
            alt=""
            draggable={false}
          />
        )}
        <BaseRadio.Indicator className="qx-picture-choice-tick" data-slot="picture-choice-tick">
          <CheckIcon shape="sharp" size={12} strokeWidth={3} aria-hidden />
        </BaseRadio.Indicator>
      </BaseRadio.Root>
    </BaseField.Item>
  );
}
