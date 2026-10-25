"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { CloudUploadIcon } from "@qeetrix/icons/icons/cloud-upload";
import { FileArchiveIcon } from "@qeetrix/icons/icons/file-archive";
import { FileCodeIcon } from "@qeetrix/icons/icons/file-code";
import { FileImageIcon } from "@qeetrix/icons/icons/file-image";
import { FileSpreadsheetIcon } from "@qeetrix/icons/icons/file-spreadsheet";
import { FileTextIcon } from "@qeetrix/icons/icons/file-text";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { fill } from "../../internal/template";
import { Progress } from "../../progress/progress";
import { useLocale, useMessages } from "../../provider/provider";

/** A file the app is handling: uploading, uploaded, or failed. */
export interface FileUploadItem {
  /** Stable, for React keys and `onRemove`. */
  id: string;
  name: string;
  /** In bytes. */
  size: number;
  /** Omit for a file that's chosen but not sent yet. */
  status?: "uploading" | "done" | "error";
  /** 0–100 while uploading; omit when the progress isn't known. */
  progress?: number;
  /** Why it failed, shown under its name. */
  error?: string;
}

export interface FileUploadProps
  extends Omit<
    BaseField.Control.Props,
    | "type"
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "onChange"
    | "onSelect"
    | "accept"
    | "multiple"
    | "className"
    | "style"
    | "render"
    | "children"
  > {
  /** The files the app is handling, with their status. */
  items?: readonly FileUploadItem[];
  /** Called with the files chosen or dropped that pass the checks: upload them here. */
  onSelect?: (files: File[]) => void;
  /** Called when an item's remove button is pressed. Without it, items have none. */
  onRemove?: (id: string) => void;
  /** The file types allowed, as the input's `accept`: ".xml,.json" or "image/*". */
  accept?: string;
  /** The largest file allowed, in bytes. */
  maxSize?: number;
  /** Allow several files at once. Default `false`. */
  multiple?: boolean;
  /** The line under the prompt. Default: written from `accept` and `maxSize` ("XML, up to 1 MB"). */
  hint?: ReactNode;
  /** Default: QeetrixProvider's locale. It formats sizes and lists of types. */
  locale?: string;
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["fileUpload"]>;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
}

const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** A size in the locale's words: "12 kB", "1.5 MB". Decimal units, as file managers show them. */
function formatSize(bytes: number, locale: string): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: UNITS[unit],
    unitDisplay: unit === 0 ? "long" : "short",
    maximumFractionDigits: unit > 0 && value < 10 ? 1 : 0,
  }).format(value);
}

const tokens = (accept: string | undefined) =>
  (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

/** Whether a file matches `accept`: an extension, a MIME type, or a "type/*" family. */
function accepts(file: File, accept: string | undefined): boolean {
  const allowed = tokens(accept);
  if (allowed.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return allowed.some((token) =>
    token.startsWith(".")
      ? name.endsWith(token)
      : token.endsWith("/*")
        ? type.startsWith(token.slice(0, -1))
        : type === token,
  );
}

/** The allowed types in words: ".xml,.json" is "XML or JSON". Families ("image/*") are left out. */
function typeNames(accept: string | undefined, locale: string): string {
  const names = tokens(accept)
    .filter((token) => !token.endsWith("/*"))
    .map((token) => (token.startsWith(".") ? token.slice(1) : (token.split("/")[1] ?? token)))
    .map((name) => name.toUpperCase());
  return names.length === 0
    ? ""
    : new Intl.ListFormat(locale, { type: "disjunction" }).format([...new Set(names)]);
}

function iconFor(name: string) {
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(name)) return FileImageIcon;
  if (/\.(csv|tsv|xlsx?|ods)$/i.test(name)) return FileSpreadsheetIcon;
  if (/\.(xml|json|ya?ml|html?|jsx?|tsx?|css|pem|crt|cer|key)$/i.test(name)) return FileCodeIcon;
  if (/\.(zip|gz|tgz|tar|7z|rar)$/i.test(name)) return FileArchiveIcon;
  return FileTextIcon;
}

/**
 * Choose or drop files (07-components.md): a drop zone over a real file input, so the keyboard and
 * screen readers get the browser's own file control, and Field's label, description and error.
 * Files that pass `accept`, `maxSize` and `multiple` go to `onSelect` for the app to upload; the
 * rest are listed with the reason. The app reports each upload in `items` (uploading with progress,
 * uploaded, or failed with a reason), and each row has a remove button.
 */
export function FileUpload({
  items = [],
  onSelect,
  onRemove,
  accept,
  maxSize,
  multiple = false,
  hint,
  locale: localeProp,
  messages,
  disabled,
  id: idProp,
  ref,
  className,
  style,
  ...props
}: FileUploadProps): ReactElement {
  const strings = useMessages("fileUpload", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const ownId = useId();
  const inputId = idProp ?? ownId;
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const next = useRef(0);
  const [dragging, setDragging] = useState(false);
  // Files this field refused, with the reason; replaced at each choice.
  const [refused, setRefused] = useState<FileUploadItem[]>([]);

  const types = typeNames(accept, locale);
  const size = maxSize === undefined ? "" : formatSize(maxSize, locale);
  const shownHint =
    hint ??
    (types && size
      ? fill(strings.hint, { types, size })
      : size
        ? fill(strings.hintSize, { size })
        : types || null);

  const take = (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (files.length === 0) return;
    const accepted: File[] = [];
    const rejected: FileUploadItem[] = [];
    files.forEach((file, index) => {
      const reason =
        !multiple && index > 0
          ? strings.tooMany
          : !accepts(file, accept)
            ? types
              ? fill(strings.wrongType, { types })
              : strings.notAllowed
            : maxSize !== undefined && file.size > maxSize
              ? fill(strings.tooBig, { size })
              : "";
      if (!reason) accepted.push(file);
      else {
        next.current += 1;
        rejected.push({
          id: `${ownId}-${next.current}`,
          name: file.name,
          size: file.size,
          status: "error",
          error: reason,
        });
      }
    });
    setRefused(rejected);
    if (accepted.length > 0) onSelect?.(accepted);
  };

  const [before, after = ""] = (multiple ? strings.dragFiles : strings.dragFile).split("{browse}");
  const entries = [...items, ...refused];

  return (
    <div
      className={cx("qx-file-upload", className)}
      style={style}
      data-slot="file-upload"
      data-disabled={disabled ? "" : undefined}
    >
      <label
        htmlFor={inputId}
        className="qx-file-upload-zone"
        data-slot="file-upload-zone"
        data-dragging={dragging ? "" : undefined}
        onDragEnter={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) take(event.dataTransfer.files);
        }}
      >
        <BaseField.Control
          {...props}
          ref={mergeRefs(ref, input)}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={shownHint == null ? undefined : hintId}
          className="qx-file-upload-input"
          data-slot="file-upload-input"
          onChange={(event) => {
            take(event.currentTarget.files);
            // Cleared, so choosing the same file again still counts.
            event.currentTarget.value = "";
          }}
        />
        <CloudUploadIcon shape="sharp" size={24} aria-hidden className="qx-file-upload-icon" />
        <span className="qx-file-upload-prompt">
          {dragging ? (
            strings.drop
          ) : (
            <>
              {before}
              <span className="qx-file-upload-browse">{strings.browse}</span>
              {after}
            </>
          )}
        </span>
        {shownHint != null && (
          <span id={hintId} className="qx-file-upload-hint">
            {shownHint}
          </span>
        )}
      </label>
      {entries.length > 0 && (
        <ul className="qx-file-upload-list" data-slot="file-upload-list" aria-live="polite">
          {entries.map((item) => {
            const Icon = iconFor(item.name);
            const isRefused = refused.includes(item);
            const remove = isRefused
              ? () => setRefused((list) => list.filter((entry) => entry !== item))
              : onRemove && (() => onRemove(item.id));
            return (
              <li
                key={item.id}
                className="qx-file-upload-item"
                data-slot="file-upload-item"
                data-status={item.status}
              >
                <Icon shape="sharp" size={20} aria-hidden className="qx-file-upload-file-icon" />
                <span className="qx-file-upload-file">
                  <span className="qx-file-upload-name">{item.name}</span>
                  <span className="qx-file-upload-meta">
                    {item.status === "error" && item.error
                      ? item.error
                      : formatSize(item.size, locale)}
                  </span>
                </span>
                <span className="qx-file-upload-status">
                  {item.status === "uploading" && (
                    <Progress
                      value={item.progress ?? null}
                      aria-label={fill(strings.uploading, { name: item.name })}
                      className="qx-file-upload-progress"
                    />
                  )}
                  {item.status === "done" && (
                    <>
                      <CircleCheckIcon shape="sharp" size={16} aria-hidden />
                      {strings.uploaded}
                    </>
                  )}
                  {item.status === "error" && (
                    <>
                      <CircleAlertIcon shape="sharp" size={16} aria-hidden />
                      {strings.failed}
                    </>
                  )}
                </span>
                {remove ? (
                  <IconButton
                    icon={XIcon}
                    aria-label={fill(strings.remove, { name: item.name })}
                    size="sm"
                    tone="neutral"
                    tooltip={false}
                    onClick={() => {
                      remove();
                      // The row's gone: focus goes back to the field, not the page.
                      input.current?.focus();
                    }}
                  />
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
