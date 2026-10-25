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
import type { HeadingLevel } from "../../heading/heading";
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
  /** What to fix, worded exactly as the field's own error ("Enter a work email"). */
  message: ReactNode;
}

export interface ErrorSummaryProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** The problems, in the order of the fields on the page. Each links to its control. */
  items: readonly ErrorSummaryItem[];
  /** The heading, worded as what to do. Default `Fix these to continue`. */
  title?: ReactNode | undefined;
  /** The heading's level: the summary sits under the page's `h1`. Default `2`. */
  headingLevel?: Exclude<HeadingLevel, 1> | undefined;
  /**
   * Take focus when it appears, so its heading is read first and Tab goes on to its links.
   * Default `true`.
   */
  autoFocus?: boolean | undefined;
  /** This summary's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["errorSummary"]> | undefined;
}

export interface FormProps extends Omit<BaseForm.Props, "className" | "style" | "render"> {
  /**
   * After a submit that fails validation, or when server `errors` arrive, list the problems at the
   * top and move focus there. Default `true`.
   */
  summary?: boolean;
  /** The summary's heading. Default `Fix these to continue`. */
  summaryTitle?: ReactNode;
  /** The summary heading's level. Default `2`. */
  summaryHeadingLevel?: Exclude<HeadingLevel, 1>;
  /** Placement only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
  /** The summary's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["errorSummary"]>;
}

/**
 * The rows a form holds: each owns its label or legend, its control and its error. A Slider with a
 * description or an error is a row of its own too.
 */
const ROW = [
  '[data-slot="field"]',
  '[data-slot="text-field"]',
  '[data-slot="checkbox-group"]',
  '[data-slot="radio-group"]',
  '[data-slot="slider-field"]',
].join(", ");

/** What a summary link can focus: the real control, never Base UI's hidden form inputs. */
const CONTROL = [
  'input:not([type="hidden"])',
  "textarea",
  "select",
  "button",
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="slider"]',
].join(", ");

/** The first match in a row that is the row's own, not a nested row's. */
function own(row: Element, selector: string): HTMLElement | undefined {
  return [...row.querySelectorAll<HTMLElement>(selector)].find((el) => el.closest(ROW) === row);
}

/**
 * The control a row's summary item links to: the one its label is `for`, else its first invalid
 * control (the first radio of a group, a checkbox inside a Field), else its first control.
 */
function controlOf(row: Element): HTMLElement | undefined {
  const label = own(row, '[data-slot="field-label"]') as HTMLLabelElement | undefined;
  const labelled = label?.htmlFor ? document.getElementById(label.htmlFor) : null;
  if (labelled && row.contains(labelled) && labelled.matches(CONTROL)) return labelled;
  const controls = [...row.querySelectorAll<HTMLElement>(CONTROL)].filter(
    (control) =>
      control.id !== "" &&
      !control.closest('[aria-hidden="true"], [data-slot="field-label-row"]') &&
      !control.matches(":disabled"),
  );
  return controls.find((control) => control.getAttribute("aria-invalid") === "true") ?? controls[0];
}

/** Every invalid row in the form: its control and its shown error. */
function invalidFields(form: HTMLFormElement): ErrorSummaryItem[] {
  return [...form.querySelectorAll<HTMLElement>(ROW)].flatMap((row) => {
    if (!row.hasAttribute("data-invalid")) return [];
    const message = own(row, '[data-slot="field-error"]')?.textContent?.trim();
    if (!message) return [];
    const id = controlOf(row)?.id;
    return [{ ...(id ? { id } : {}), message }];
  });
}

/**
 * Focus a control from a summary link (GOV.UK): its label, or a group's legend, scrolls into view,
 * so the question is seen with the control; then the control takes focus.
 */
function focusControl(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const control = document.getElementById(id);
  if (!control) return;
  event.preventDefault();
  const row = control.closest(ROW);
  const caption = row
    ? own(
        row,
        '[data-slot="field-label"], [data-slot$="-group-legend"], [data-slot="slider-label"]',
      )
    : undefined;
  const visible = caption && !caption.hasAttribute("data-hidden") ? caption : control;
  visible.scrollIntoView();
  control.focus({ preventScroll: true });
}

/**
 * Focus the summary as GOV.UK does: it's focusable only until focus leaves it, so a later click on
 * its text doesn't frame it again.
 */
function focusSummary(element: HTMLElement | null) {
  if (!element || element === document.activeElement) return;
  if (!element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
    element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  }
  element.focus();
}

/**
 * The problems that stop a form going through, listed at its top (GOV.UK's error summary): the
 * danger Alert, announced as an alert, its title a heading, and each item worded exactly as the
 * field's own error and linking to the control. It takes focus when it appears, so its heading is
 * read first.
 */
export function ErrorSummary({
  items,
  title,
  headingLevel = 2,
  autoFocus = true,
  messages,
  className,
  ref,
  ...props
}: ErrorSummaryProps): ReactElement {
  const strings = useMessages("errorSummary", messages);
  const root = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as const;

  const focusOnMount = useEffectEvent(() => {
    if (autoFocus && items.length > 0) focusSummary(root.current);
  });
  useEffect(() => focusOnMount(), []);

  // The focus target and the alert are separate elements, as in GOV.UK's, so moving focus doesn't
  // race the alert's announcement.
  return (
    <div
      {...props}
      ref={mergeRefs(ref, root)}
      className={cx("qx-error-summary", className)}
      data-slot="error-summary"
    >
      <Alert
        tone="danger"
        announce="urgent"
        title={<Heading className="qx-error-summary-title">{title ?? strings.title}</Heading>}
      >
        <ul className="qx-error-summary-list" data-slot="error-summary-list">
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
    </div>
  );
}

/** Whether two summaries list the same problems, so an unchanged one isn't re-rendered. */
const same = (a: readonly ErrorSummaryItem[], b: readonly ErrorSummaryItem[]) =>
  a.length === b.length &&
  a.every((item, i) => item.id === b[i]?.id && item.message === b[i]?.message);

/**
 * A form on Base UI's Form: fields validate on submit (or on blur or change with
 * `validationMode`), server errors arrive through `errors`, keyed by each field's `name`, and
 * `onFormSubmit` runs only when every field is valid. Fields stand `space.form-gap` apart. A
 * failed submit, or server errors, put an ErrorSummary at the top and move focus to it. It reads
 * every kind of row: Field, TextField, CheckboxGroup, RadioGroup, and a Slider with its own error.
 */
export function Form({
  summary = true,
  summaryTitle,
  summaryHeadingLevel,
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
  const refocus = useRef(false);
  const [items, setItems] = useState<ErrorSummaryItem[]>([]);

  // After Base UI has validated and painted the errors, read them back from the rows.
  const review = () =>
    requestAnimationFrame(() => {
      if (!form.current) return;
      const found = invalidFields(form.current);
      refocus.current = found.length > 0;
      setItems((shown) => (same(shown, found) ? shown : found));
    });

  // A new summary focuses itself; a changed one, after the next failed submit, is focused here.
  useEffect(() => {
    if (refocus.current && items.length > 0) focusSummary(summaryRef.current);
    refocus.current = false;
  }, [items]);

  // Server errors arrive after a submit: summarise them once the fields show them.
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
        <ErrorSummary
          ref={summaryRef}
          items={items}
          title={summaryTitle}
          headingLevel={summaryHeadingLevel}
          messages={messages}
        />
      )}
      {children}
    </BaseForm>
  );
}
