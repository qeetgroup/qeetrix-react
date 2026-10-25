"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { InfoIcon } from "@qeetrix/icons/icons/info";
import { TriangleAlertIcon } from "@qeetrix/icons/icons/triangle-alert";
import { XIcon } from "@qeetrix/icons/icons/x";
import type { ReactElement, ReactNode } from "react";
import { Button, IconButton } from "../button/button";
import type { QeetrixIcon } from "../internal/control";
import { messages } from "../internal/messages";

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
  /** Milliseconds before it closes. Default 5000; `danger` toasts ignore it. */
  timeout?: number;
  /** Your own id, to update or close it later. */
  id?: string;
  /** Called when it closes, however it closes. */
  onClose?: () => void;
}

export interface ToastPromiseOptions<Value> {
  loading: ToastOptions;
  success: ToastOptions | ((value: Value) => ToastOptions);
  error: ToastOptions | ((error: unknown) => ToastOptions);
}

export interface ToastApi {
  /** Shows a toast and returns its id. */
  add: (options: ToastOptions) => string;
  /** Closes one toast, or every toast with no id. */
  close: (id?: string) => void;
  /** Changes a toast that is showing. */
  update: (id: string, options: Partial<ToastOptions>) => void;
  /** Shows `loading`, then `success` or `error` when the promise settles; returns the promise. */
  promise: <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>;
}

export interface ToastProviderProps {
  /** Your app. */
  children?: ReactNode;
  /** The most toasts shown at once; older ones wait. Default 3. */
  limit?: number;
  /** Default milliseconds before a toast closes. Default 5000. */
  timeout?: number;
}

const ICONS: Record<ToastTone, QeetrixIcon> = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
};

type BaseOptions = Parameters<ReturnType<typeof BaseToast.useToastManager>["add"]>[0];

/** Qeetrix options in Base UI's terms: the tone is the type, and danger never times out. */
function toBase(options: Partial<ToastOptions>): Partial<BaseOptions> {
  const { tone, action, timeout, ...rest } = options;
  const base: Partial<BaseOptions> = { ...rest };
  if (tone !== undefined) base.type = tone;
  if (timeout !== undefined) base.timeout = timeout;
  if (tone === "danger") {
    base.timeout = 0;
    base.priority = "high";
  }
  if (action !== undefined) base.actionProps = { children: action.label, onClick: action.onClick };
  return base;
}

/**
 * Shows toasts from anywhere inside ToastProvider:
 * `const toast = useToast(); toast.add({ title: "Invoice sent", tone: "success" })`.
 */
export function useToast(): ToastApi {
  const manager = BaseToast.useToastManager();
  return {
    add: (options) => manager.add(toBase({ tone: "info", ...options }) as BaseOptions),
    close: (id) => manager.close(id),
    update: (id, options) => manager.update(id, toBase(options)),
    promise: (promise, { loading, success, error }) =>
      manager.promise(promise, {
        loading: toBase({ tone: "info", ...loading }),
        success: (value) =>
          toBase({
            tone: "success",
            ...(typeof success === "function" ? success(value) : success),
          }),
        error: (reason) =>
          toBase({ tone: "danger", ...(typeof error === "function" ? error(reason) : error) }),
      }),
  };
}

function ToastList(): ReactElement[] {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((toast) => {
    const tone = (toast.type ?? "info") as ToastTone;
    const Icon = ICONS[tone] ?? InfoIcon;
    return (
      <BaseToast.Root
        key={toast.id}
        toast={toast}
        className="qx-toast"
        data-slot="toast"
        data-tone={tone}
      >
        <Icon shape="sharp" size={18} aria-hidden className="qx-toast-icon" />
        <BaseToast.Content className="qx-toast-content">
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
          render={
            <IconButton icon={XIcon} aria-label={messages.toast.close} size="sm" tooltip={false} />
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
}: ToastProviderProps): ReactElement {
  return (
    <BaseToast.Provider limit={limit} timeout={timeout}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          className="qx-toast-viewport"
          data-slot="toast-viewport"
          aria-label={messages.toast.region}
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
