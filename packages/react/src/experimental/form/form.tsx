"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import {
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { Link } from "../../link/link";
import { useMessages } from "../../provider/provider";
import { Alert } from "../alert/alert";

/** One problem: the control it belongs to, and the message, worded exactly as next to the field. */
export interface ErrorSummaryItem {
  /** The id of the control to focus. Without one, the item is plain text. */
  id?: string;
  message: ReactNode;
}

export interface ErrorSummaryProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  items: readonly ErrorSummaryItem[];
  /** Default "Fix these to continue". */
  title?: ReactNode | undefined;
  /** This summary's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["errorSummary"]> | undefined;
}

export interface FormProps extends Omit<BaseForm.Props, "className" | "style" | "render"> {
  /**
   * After a submit that fails validation, or when server `errors` arrive, list the problems at the
   * top and move focus there. Default `true`.
   */
  summary?: boolean;
  /** The summary's title. Default "Fix these to continue". */
  summaryTitle?: ReactNode;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
  /** The summary's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["errorSummary"]>;
}

/** Focus a control from a summary link, and bring it into view. */
function focusControl(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const control = document.getElementById(id);
  if (!control) return;
  event.preventDefault();
  control.focus();
  control.scrollIntoView({ block: "center" });
}

/**
 * The problems that stop a form going through, listed at its top (07-components.md; GOV.UK's
 * error summary): the danger Alert, each item worded exactly as the field's own error and linking
 * to the control. It takes focus when it appears, so its title is read first.
 */
export function ErrorSummary({
  items,
  title,
  messages,
  className,
  ...props
}: ErrorSummaryProps): ReactElement {
  const strings = useMessages("errorSummary", messages);
  return (
    <Alert
      {...props}
      tone="danger"
      title={title ?? strings.title}
      tabIndex={-1}
      className={cx("qx-error-summary", className)}
    >
      <ul className="qx-error-summary-list">
        {items.map((item, index) => (
          <li key={item.id ?? index}>
            {item.id ? (
              <Link
                href={`#${item.id}`}
                onClick={(event) => focusControl(event, item.id as string)}
              >
                {item.message}
              </Link>
            ) : (
              item.message
            )}
          </li>
        ))}
      </ul>
    </Alert>
  );
}

/** Whether two summaries list the same problems, so an unchanged one isn't re-rendered. */
const same = (a: readonly ErrorSummaryItem[], b: readonly ErrorSummaryItem[]) =>
  a.length === b.length &&
  a.every((item, i) => item.id === b[i]?.id && item.message === b[i]?.message);

/** Every invalid Field in the form: its control, through the label, and its shown error. */
function invalidFields(form: HTMLFormElement): ErrorSummaryItem[] {
  return [...form.querySelectorAll<HTMLElement>('[data-slot="field"][data-invalid]')].flatMap(
    (field) => {
      const message = field.querySelector('[data-slot="field-error"]')?.textContent?.trim();
      if (!message) return [];
      const label = field.querySelector<HTMLLabelElement>('[data-slot="field-label"]');
      return [{ ...(label?.htmlFor ? { id: label.htmlFor } : {}), message }];
    },
  );
}

/**
 * A form (07-components.md), on Base UI's Form: Fields validate on submit (or on blur or change
 * with `validationMode`), server errors arrive through `errors`, keyed by each Field's `name`, and
 * `onFormSubmit` runs only when every field is valid. Fields stand `space.form-gap` apart. A
 * failed submit, or server errors, put an ErrorSummary at the top and move focus to it.
 */
export function Form({
  summary = true,
  summaryTitle,
  messages,
  errors,
  onSubmitCapture,
  ref,
  className,
  style,
  children,
  ...props
}: FormProps): ReactElement {
  const form = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusSummary = useRef(false);
  const [items, setItems] = useState<ErrorSummaryItem[]>([]);

  // After Base UI has validated and painted the errors, read them back from the Fields.
  const review = () =>
    requestAnimationFrame(() => {
      if (!form.current) return;
      const found = invalidFields(form.current);
      focusSummary.current = found.length > 0;
      setItems((shown) => (same(shown, found) ? shown : found));
    });

  useEffect(() => {
    if (focusSummary.current && items.length > 0) summaryRef.current?.focus();
    focusSummary.current = false;
  }, [items]);

  // Server errors arrive after a submit: summarise them once the Fields show them.
  const reviewServerErrors = useEffectEvent(() => review());
  useEffect(() => {
    if (summary && errors && Object.keys(errors).length > 0) reviewServerErrors();
  }, [summary, errors]);

  return (
    <BaseForm
      {...props}
      {...(errors === undefined ? {} : { errors })}
      ref={mergeRefs(ref, form)}
      // Base UI skips `onSubmit` when validation fails, so listen in the capture phase, before
      // it validates; the review reads the fields a frame later, once their errors are shown.
      onSubmitCapture={(event) => {
        onSubmitCapture?.(event);
        if (summary) review();
      }}
      className={cx("qx-form", className)}
      style={style}
      data-slot="form"
    >
      {summary && items.length > 0 && (
        <ErrorSummary ref={summaryRef} items={items} title={summaryTitle} messages={messages} />
      )}
      {children}
    </BaseForm>
  );
}
