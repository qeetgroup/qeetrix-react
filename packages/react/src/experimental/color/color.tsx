"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { PipetteIcon } from "@qeetrix/icons/icons/pipette";
import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useState,
  useSyncExternalStore,
} from "react";
import { Button, IconButton } from "../../button/button";
import { Input, type InputProps } from "../../input/input";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

/**
 * A colour as `#RRGGBB`, from what someone typed: `#f97316`, `f97316` or `#f73`. `null` when it
 * isn't a hex colour.
 */
export function toHexColor(text: string): string | null {
  const raw = text.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${[...raw].map((digit) => digit + digit).join("")}`.toUpperCase();
  }
  return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}`.toUpperCase() : null;
}

/** WCAG's contrast ratio between two `#RRGGBB` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((at) => {
      const channel = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

// ---- ColorSwatchGroup -------------------------------------------------------------------------

export interface ColorSwatchOption {
  /** What's chosen: a token name, `--qx-color-icon-brand`, or a hex colour. */
  value: string;
  /** Its name, read out and shown on hover: "Brand". */
  label: string;
  /** The colour shown. Default: `value`, as `var(value)` when it's a custom property. */
  color?: string;
}

export interface ColorSwatchGroupProps {
  options: readonly ColorSwatchOption[];
  /** The chosen value, for a controlled group; `null` for none. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Names the group: "Icon colour". */
  "aria-label": string;
  disabled?: boolean | undefined;
  className?: string;
  style?: CSSProperties;
}

const shown = (option: ColorSwatchOption) =>
  option.color ?? (option.value.startsWith("--") ? `var(${option.value})` : option.value);

/**
 * One colour from a few: a row of square swatches, each named and shown in its colour, the chosen
 * one ringed. A radio group: Tab reaches the chosen swatch, the arrow keys move and choose.
 */
export function ColorSwatchGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  "aria-label": label,
  disabled,
  className,
  style,
}: ColorSwatchGroupProps): ReactElement {
  // A field of its own, each swatch an item in it: in a Field (ColorField's suggestions, say) Base UI
  // would otherwise give its radios that field's id, name and label, and count them towards its
  // dirty and filled state. It's always named by its own aria-label.
  return (
    <BaseField.Root render={<span className="qx-color-swatch-field" />}>
      <BaseRadioGroup
        aria-label={label}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        onValueChange={(next) => onValueChange?.(String(next))}
        disabled={disabled}
        className={cx("qx-color-swatches", className)}
        style={style}
        data-slot="color-swatch-group"
      >
        {options.map((option) => (
          <BaseField.Item key={option.value} render={<span className="qx-color-swatch-item" />}>
            <BaseRadio.Root
              value={option.value}
              aria-label={option.label}
              title={option.label}
              className="qx-color-swatch"
              data-slot="color-swatch"
              style={{ "--qx-color-swatch": shown(option) } as CSSProperties}
            />
          </BaseField.Item>
        ))}
      </BaseRadioGroup>
    </BaseField.Root>
  );
}

// ---- ColorField -------------------------------------------------------------------------------

interface EyeDropperResult {
  sRGBHex: string;
}
type EyeDropperConstructor = new () => { open: () => Promise<EyeDropperResult> };
const subscribeNothing = () => () => {};

export interface ColorFieldProps
  extends Omit<
    InputProps,
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "onChange"
    | "type"
    | "startAdornment"
    | "endAdornment"
    | "children"
  > {
  /** What's typed: a hex colour, or `""` for the default. */
  value?: string;
  defaultValue?: string;
  /** Called with the text as it's typed, picked or suggested (picked colours as `#RRGGBB`). */
  onValueChange?: (value: string) => void;
  /** Suggested colours beside the field, each chosen with a click. */
  suggestions?: readonly ColorSwatchOption[];
  /** A button that empties the field, back to the default: "Use Qeet Ember". */
  resetLabel?: ReactNode;
  /**
   * A colour the value is read on, for a contrast line that follows the typing and warns under
   * 4.5:1: `{ against: "#FFFFFF", label: "the sign-in card" }`.
   */
  contrast?: { against: string; label: string };
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["colorField"]>;
}

/**
 * A colour of someone's own: a hex field whose swatch opens the system colour picker, with the
 * browser's eyedropper where it has one. Suggestions, a reset to the default and a contrast line can
 * sit under it. Use in a Field; `toHexColor` checks what's typed.
 */
export function ColorField({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  suggestions,
  resetLabel,
  contrast,
  messages,
  disabled,
  className,
  style,
  ...props
}: ColorFieldProps): ReactElement {
  const strings = useMessages("colorField", messages);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const text = valueProp ?? uncontrolled;
  const hex = toHexColor(text);
  // The browser's eyedropper, where it has one; never on the server.
  const dropper = useSyncExternalStore(
    subscribeNothing,
    () => (window as { EyeDropper?: EyeDropperConstructor }).EyeDropper ?? null,
    () => null,
  );

  const change = (next: string) => {
    if (valueProp === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };
  const ratio = contrast && hex ? contrastRatio(hex, toHexColor(contrast.against) ?? "#FFFFFF") : 0;

  return (
    <div className={cx("qx-color-field", className)} style={style} data-slot="color-field">
      <Input
        {...props}
        disabled={disabled}
        value={text}
        onValueChange={(next) => change(next)}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        startAdornment={
          <label
            className="qx-color-field-swatch"
            data-slot="color-field-swatch"
            data-empty={hex ? undefined : ""}
            style={hex ? ({ "--qx-color-swatch": hex } as CSSProperties) : undefined}
          >
            <input
              type="color"
              value={hex?.toLowerCase() ?? "#000000"}
              disabled={disabled}
              aria-label={strings.pick}
              onChange={(event) => change(event.currentTarget.value.toUpperCase())}
            />
          </label>
        }
        endAdornment={
          dropper ? (
            <IconButton
              icon={PipetteIcon}
              size="sm"
              tone="neutral"
              disabled={disabled}
              aria-label={strings.eyeDropper}
              onClick={() => {
                new dropper()
                  .open()
                  .then((result) => change(result.sRGBHex.toUpperCase()))
                  .catch(() => {});
              }}
            />
          ) : undefined
        }
      />
      {(suggestions?.length || resetLabel != null) && (
        <div className="qx-color-field-suggestions">
          {suggestions?.length ? (
            <ColorSwatchGroup
              aria-label={strings.suggestions}
              options={suggestions}
              value={suggestions.find((option) => toHexColor(option.value) === hex)?.value ?? null}
              onValueChange={(next) => change(toHexColor(next) ?? next)}
              disabled={disabled}
            />
          ) : null}
          {resetLabel != null && (
            <Button
              variant="ghost"
              tone="neutral"
              size="sm"
              disabled={disabled || text === ""}
              onClick={() => change("")}
            >
              {resetLabel}
            </Button>
          )}
        </div>
      )}
      {contrast && (
        <p
          className="qx-color-field-contrast"
          data-slot="color-field-contrast"
          data-low={hex && ratio < 4.5 ? "" : undefined}
          aria-live="polite"
        >
          {hex
            ? fill(ratio < 4.5 ? strings.contrastLow : strings.contrast, {
                ratio: (Math.floor(ratio * 10) / 10).toFixed(1),
                against: contrast.label,
              })
            : null}
        </p>
      )}
    </div>
  );
}
