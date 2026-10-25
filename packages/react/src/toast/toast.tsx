"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { InfoIcon } from "@qeetrix/icons/icons/info";
import { TriangleAlertIcon } from "@qeetrix/icons/icons/triangle-alert";
import { XIcon } from "@qeetrix/icons/icons/x";
import { type ComponentProps, type ReactElement, type ReactNode, useMemo } from "react";
import { Button, IconButton } from "../button/button";
import type { QeetrixIcon } from "../internal/control";
import type { QeetrixMessages } from "../internal/messages";
import { useMessages } from "../provider/provider";
import { Spinner } from "../spinner/spinner";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  /** What happened, in a few words ("Invoice sent"). */
  title: ReactNode;
  /** One more line, if it helps. */
  description?: ReactNode;
  /** Default `info`. A `danger` toast stays until dismissed and is announced at once. */
  tone?: ToastTone;
  /** At most one action, such as Undo. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it closes; `danger` toasts ignore it. Default `5000`. */
  timeout?: number;
  /** Your own id, to update or close it later. */
  id?: string;
  /** Called when it closes, however it closes. */
  onClose?: () => void;
}

export interface ToastPromiseOptions<Value> {
  /** The toast while the promise is pending: a spinner shows in place of the status icon. */
  loading: ToastOptions;
  /** The toast once it resolves, or a function of the value. Its tone defaults to `success`. */
  success: ToastOptions | ((value: Value) => ToastOptions);
  /** The toast if it rejects, or a function of the reason. Its tone defaults to `danger`. */
  error: ToastOptions | ((error: unknown) => ToastOptions);
}

export interface ToastApi {
  /** Shows a toast and returns its id. */
  add: (options: ToastOptions) => string;
  /** Closes one toast, or every toast with no id. */
  close: (id?: string) => void;
  /** Changes a toast that is showing. */
  update: (id: string, options: Partial<ToastOptions>) => void;
  /**
   * Shows `loading`, with a spinner, then `success` or `error` when the promise settles; returns
   * the promise.
   */
  promise: <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>;
}

export interface ToastProviderProps {
  /** Your app. */
  children?: ReactNode;
  /** The most toasts shown at once; older ones wait. Default `3`. */
  limit?: number;
  /** Milliseconds before a toast closes, unless it sets its own `timeout`. Default `5000`. */
  timeout?: number;
  /** The region's name and the close label, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["toast"]>;
}

const ICONS: Record<ToastTone, QeetrixIcon> = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
};

/** What Qeetrix keeps on a Base UI toast: its tone, which `promise` can't carry in `type`. */
interface ToastData {
  tone?: ToastTone;
}
type BaseOptions = Parameters<ReturnType<typeof BaseToast.useToastManager<ToastData>>["add"]>[0];

/** Qeetrix options in Base UI's terms: the tone is the type, and danger never times out. */
function toBase(options: Partial<ToastOptions>): Partial<BaseOptions> {
  const { tone, action, timeout, ...rest } = options;
  const base: Partial<BaseOptions> = { ...rest };
  if (tone !== undefined) {
    base.type = tone;
    // `promise` replaces the type with its own (loading, success, error); the tone survives.
    base.data = { tone };
    base.priority = tone === "danger" ? "high" : "low";
  }
  if (timeout !== undefined) base.timeout = timeout;
  if (tone === "danger") base.timeout = 0;
  if (action !== undefined) base.actionProps = { children: action.label, onClick: action.onClick };
  return base;
}

/** A toast's tone: the one Qeetrix set, else its Base UI type, where `error` is `danger`. */
function toneOf(toast: { type?: string | undefined; data?: ToastData | undefined }): ToastTone {
  const tone = toast.data?.tone ?? (toast.type === "error" ? "danger" : toast.type);
  return tone !== undefined && Object.hasOwn(ICONS, tone) ? (tone as ToastTone) : "info";
}

/**
 * Shows toasts from anywhere inside ToastProvider:
 * `const toast = useToast(); toast.add({ title: "Invoice sent", tone: "success" })`. It returns the
 * same object on every render, so it can sit in an effect's or a callback's dependencies.
 */
export function useToast(): ToastApi {
  const { add, close, update, promise } = BaseToast.useToastManager<ToastData>();
  return useMemo(
    (): ToastApi => ({
      add: (options) => add(toBase({ tone: "info", ...options }) as BaseOptions),
      close: (id) => close(id),
      update: (id, options) => update(id, toBase(options)),
      promise: (pending, { loading, success, error }) =>
        promise(pending, {
          loading: toBase({ tone: "info", ...loading }),
          success: (value) =>
            toBase({
              tone: "success",
              ...(typeof success === "function" ? success(value) : success),
            }),
          error: (reason) =>
            toBase({ tone: "danger", ...(typeof error === "function" ? error(reason) : error) }),
        }),
    }),
    [add, close, update, promise],
  );
}

/**
 * The toast's element. Base UI announces a high-priority (danger) toast from a visually hidden
 * `role="alert"` copy and, while that copy is up (the region isn't focused), hides the toast itself
 * with `aria-hidden`, so the polite region doesn't read it a second time. But the toast stays
 * focusable, and so do its buttons: a focusable element inside `aria-hidden` is silent to a screen
 * reader (axe `aria-hidden-focus`). So the toast stays exposed, and leaves the polite region with
 * `aria-live="off"` instead, exactly while Base UI would have hidden it; the copy still announces
 * it assertively.
 */
const toastElement: BaseToast.Root.Props["render"] = ({
  "aria-hidden": hidden,
  ...props
}: ComponentProps<"div">) => <div {...props} aria-live={hidden ? "off" : undefined} />;

function ToastList({ closeLabel }: { closeLabel: string }): ReactElement[] {
  const { toasts } = BaseToast.useToastManager<ToastData>();
  return toasts.map((toast) => {
    const tone = toneOf(toast);
    const loading = toast.type === "loading";
    const urgent = toast.priority === "high";
    const Icon = ICONS[tone];
    return (
      <BaseToast.Root
        key={toast.id}
        toast={toast}
        render={toastElement}
        className="qx-toast"
        data-slot="toast"
        data-tone={tone}
        data-loading={loading ? "" : undefined}
      >
        {loading ? (
          <span className="qx-toast-icon qx-toast-spinner" data-slot="toast-icon">
            <Spinner decorative />
          </span>
        ) : (
          <Icon
            shape="sharp"
            size={18}
            aria-hidden
            className="qx-toast-icon"
            data-slot="toast-icon"
          />
        )}
        <BaseToast.Content className="qx-toast-content" data-slot="toast-content">
          <BaseToast.Title className="qx-toast-title" data-slot="toast-title" />
          <BaseToast.Description className="qx-toast-description" data-slot="toast-description" />
        </BaseToast.Content>
        {toast.actionProps && (
          <BaseToast.Action
            className="qx-toast-action"
            render={<Button variant="ghost" size="sm" />}
          />
        )}
        <BaseToast.Close
          {...(urgent ? { "aria-hidden": undefined } : {})}
          render={
            <IconButton
              icon={XIcon}
              aria-label={closeLabel}
              size="sm"
              tone="neutral"
              tooltip={false}
            />
          }
        />
      </BaseToast.Root>
    );
  });
}

/**
 * Wrap the app once. It renders the toast region: a landmark named "Notifications" at the bottom
 * end, reachable with F6. Toasts pause while hovered or focused and swipe away on touch.
 */
export function ToastProvider({
  children,
  limit = 3,
  timeout = 5000,
  messages,
}: ToastProviderProps): ReactElement {
  const strings = useMessages("toast", messages);
  return (
    <BaseToast.Provider limit={limit} timeout={timeout}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          className="qx-toast-viewport"
          data-slot="toast-viewport"
          aria-label={strings.region}
        >
          <ToastList closeLabel={strings.close} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
