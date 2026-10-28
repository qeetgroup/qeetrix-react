"use client";

import { Field as BaseField } from "@base-ui/react/field";
import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../internal/cx";
import { type CodeLanguage, highlight } from "../code-block/highlight";

export interface CodeFieldProps
  extends Omit<
    ComponentProps<"textarea">,
    "value" | "defaultValue" | "onChange" | "rows" | "children" | "wrap"
  > {
  /** The code, for a controlled field. */
  value?: string;
  /** The code at first, for an uncontrolled field. */
  defaultValue?: string;
  /** Called with the code as it changes. */
  onValueChange?: (value: string) => void;
  /** How to colour it, as CodeBlock does. Default `text`. */
  language?: CodeLanguage;
  /** Number the lines. Default `true`. */
  lineNumbers?: boolean;
  /** Its height before it grows, in lines. Default `4`. */
  rows?: number;
  /** The most lines it grows to; then it scrolls. Default `20`. */
  maxRows?: number;
}

const INDENT = "  ";

/**
 * Code to edit, such as a JSON request: the code type, coloured as it's typed, with line numbers.
 * Tab indents and Shift+Tab outdents the line; to leave the field by keyboard, press Escape, then
 * Tab. Use in a Field for its label, description and error. Not an editor: no completion, no
 * folding.
 */
export function CodeField({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  language = "text",
  lineNumbers = true,
  rows = 4,
  maxRows = 20,
  className,
  style,
  onKeyDown,
  ...props
}: CodeFieldProps): ReactElement {
  const [own, setOwn] = useState(defaultValue);
  const code = valueProp ?? own;
  const field = useRef<HTMLTextAreaElement>(null);
  // After Escape, Tab leaves the field once.
  const escaped = useRef(false);
  // The caret to put back once an indent has re-rendered the code.
  const caret = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    if (caret.current && field.current) {
      field.current.setSelectionRange(...caret.current);
      caret.current = null;
    }
  });

  const change = (next: string) => {
    if (valueProp === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      escaped.current = true;
      return;
    }
    if (event.key !== "Tab" || escaped.current || event.altKey || event.ctrlKey || event.metaKey) {
      escaped.current = false;
      return;
    }
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;
    if (event.shiftKey) {
      const lineStart = code.lastIndexOf("\n", start - 1) + 1;
      const removed = /^ {1,2}/.exec(code.slice(lineStart))?.[0].length ?? 0;
      if (!removed) return;
      change(code.slice(0, lineStart) + code.slice(lineStart + removed));
      caret.current = [Math.max(lineStart, start - removed), Math.max(lineStart, end - removed)];
    } else {
      change(code.slice(0, start) + INDENT + code.slice(end));
      caret.current = [start + INDENT.length, start + INDENT.length];
    }
  };

  const lines = highlight(code, language);
  const count = lines.length;
  const longest = Math.max(1, ...code.split("\n").map((line) => line.length));

  return (
    <div
      className={cx("qx-code-field", className)}
      style={
        {
          "--qx-code-field-rows": rows,
          "--qx-code-field-max-rows": maxRows,
          "--qx-code-digits": Math.max(2, String(count).length),
          ...style,
        } as CSSProperties
      }
      data-slot="code-field"
      data-numbers={lineNumbers ? "" : undefined}
    >
      {lineNumbers && (
        <div className="qx-code-field-gutter" aria-hidden>
          {lines.map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are positions
            <span key={index}>{index + 1}</span>
          ))}
        </div>
      )}
      <div className="qx-code-field-editor">
        <pre className="qx-code-field-highlight" aria-hidden>
          <code>
            {lines.map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines are positions in the code
              <span key={index} className="qx-code-field-line">
                {line.map((token, at) =>
                  token.kind === "plain" ? (
                    token.text
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positions in their line
                    <span key={at} data-token={token.kind}>
                      {token.text}
                    </span>
                  ),
                )}
              </span>
            ))}
          </code>
        </pre>
        <BaseField.Control
          {...(props as BaseField.Control.Props)}
          ref={field}
          render={<textarea rows={Math.max(rows, count)} wrap="off" />}
          value={code}
          onValueChange={(next) => change(String(next))}
          // Base UI types the control as an input; it renders the textarea here.
          onKeyDown={keyDown as unknown as BaseField.Control.Props["onKeyDown"]}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="qx-code-field-control"
          style={{ inlineSize: `max(100%, ${longest + 2}ch)` }}
          data-slot="code-field-control"
        />
      </div>
    </div>
  );
}
