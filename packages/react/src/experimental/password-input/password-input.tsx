"use client";

import { ArrowBigUpIcon } from "@qeetrix/icons/icons/arrow-big-up";
import { EyeIcon } from "@qeetrix/icons/icons/eye";
import { EyeOffIcon } from "@qeetrix/icons/icons/eye-off";
import {
  type KeyboardEvent,
  type ReactElement,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { Input, type InputProps } from "../../input/input";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  /**
   * `current-password` to sign in, `new-password` to create one, so password managers fill or
   * suggest; `off` for a secret that isn't the user's password, such as an API key. Default
   * `current-password`.
   */
  autoComplete?: "current-password" | "new-password" | "off";
  /** Whether the value shows as text, controlled. */
  visible?: boolean;
  /** Whether it starts visible when uncontrolled. Default `false`: people may not be alone. */
  defaultVisible?: boolean;
  /** Called with the new visibility. */
  onVisibleChange?: (visible: boolean) => void;
  /** Show "Caps Lock is on" while typing with it on. Default `true`. */
  capsLockWarning?: boolean;
  /** This input's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["passwordInput"]>;
}

/**
 * A password or secret field: an Input with a Show password toggle. It hides again when its form
 * is submitted, so the browser never stores it as plain text; spelling and capitalisation tools
 * stay off; paste always works, and there's no length cap.
 */
export function PasswordInput({
  autoComplete = "current-password",
  visible,
  defaultVisible = false,
  onVisibleChange,
  capsLockWarning = true,
  messages,
  endAdornment,
  disabled,
  ref,
  onKeyDown,
  onKeyUp,
  onBlur,
  className,
  ...props
}: PasswordInputProps): ReactElement {
  const strings = useMessages("passwordInput", messages);
  const input = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState(defaultVisible);
  const shown = visible ?? own;
  const [announcement, setAnnouncement] = useState("");
  const [capsLock, setCapsLock] = useState(false);

  const setShown = (next: boolean) => {
    if (visible === undefined) setOwn(next);
    onVisibleChange?.(next);
  };

  // Submitting hides it first, before the browser reads the form.
  const hideOnSubmit = useEffectEvent(() => {
    if (input.current) input.current.type = "password";
    if (shown) setShown(false);
  });
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const onSubmit = () => hideOnSubmit();
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  const toggle = () => {
    const field = input.current;
    const selection = field ? [field.selectionStart, field.selectionEnd] : [null, null];
    setShown(!shown);
    setAnnouncement(shown ? strings.hidden : strings.shown);
    // Changing the type can reset the caret; put it back where the person left it.
    requestAnimationFrame(() => {
      const [start, end] = selection;
      if (field && start != null && end != null) field.setSelectionRange(start, end);
    });
  };

  const readCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    if (capsLockWarning) setCapsLock(event.getModifierState("CapsLock"));
  };

  return (
    <Input
      {...props}
      ref={mergeRefs(ref, input)}
      type={shown ? "text" : "password"}
      autoComplete={autoComplete}
      spellCheck={false}
      autoCapitalize="none"
      autoCorrect="off"
      disabled={disabled}
      className={className ? `qx-password-input ${className}` : "qx-password-input"}
      onKeyDown={(event) => {
        readCapsLock(event);
        onKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        readCapsLock(event);
        onKeyUp?.(event);
      }}
      onBlur={(event) => {
        setCapsLock(false);
        onBlur?.(event);
      }}
      endAdornment={
        <>
          {capsLock && (
            <span className="qx-password-input-caps" data-slot="password-input-caps">
              <ArrowBigUpIcon shape="sharp" size={14} aria-hidden />
              {strings.capsLock}
            </span>
          )}
          {endAdornment}
          <IconButton
            icon={shown ? EyeOffIcon : EyeIcon}
            aria-label={strings.show}
            aria-pressed={shown}
            size="sm"
            tone="neutral"
            disabled={disabled}
            onClick={toggle}
            className="qx-password-input-toggle"
          />
          <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
        </>
      }
    />
  );
}
