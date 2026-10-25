"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { CopyButton } from "../copy-button/copy-button";
import { type CodeLanguage, highlight } from "./highlight";

export interface CodeBlockProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The code, as it should be copied. */
  code: string;
  /** How to colour it. Default `text`, no colours. */
  language?: CodeLanguage;
  /** The header's label. Default: the language's name. */
  title?: ReactNode;
  /** Number the lines. Default: when there's more than one. */
  lineNumbers?: boolean;
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  /** This block's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["codeBlock"]>;
}

/** Format names stay as they are in every language; only "Shell" is a word, so it's in the catalogue. */
const NAMES: Record<Exclude<CodeLanguage, "shell" | "text">, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  tsx: "TSX",
  json: "JSON",
  xml: "XML",
  html: "HTML",
};

/**
 * Code to read and copy (07-components.md): a command, a snippet, a JSON event or XML metadata,
 * in monospace, coloured by the code tokens with our own small highlighter, with one Copy button.
 * More than one line gets a header with the language and the button, and line numbers (drawn by
 * CSS, so copying never picks them up). Long lines scroll sideways in a focusable region, or
 * `wrap`. Ligatures are off, so code shows exactly as typed.
 */
export function CodeBlock({
  code,
  language = "text",
  title,
  lineNumbers,
  wrap = false,
  messages,
  className,
  ...props
}: CodeBlockProps): ReactElement {
  const strings = useMessages("codeBlock", messages);
  const lines = highlight(code.replace(/\n$/, ""), language);
  const several = lines.length > 1;
  const name = language === "shell" ? strings.shell : language === "text" ? "" : NAMES[language];
  const label = title ?? name;
  const header = several || title != null;
  const copy = <CopyButton value={code} label={strings.copy} size="sm" />;

  return (
    <div
      {...props}
      className={cx("qx-code-block", className)}
      data-slot="code-block"
      data-header={header ? "" : undefined}
    >
      {header && (
        <div className="qx-code-block-header" data-slot="code-block-header">
          <span className="qx-code-block-title">{label}</span>
          {copy}
        </div>
      )}
      <div className="qx-code-block-body">
        <section
          // A region that scrolls must be reachable by keyboard to scroll it; wrapped code doesn't.
          tabIndex={wrap ? undefined : 0}
          aria-label={typeof label === "string" && label ? label : strings.region}
          className="qx-code-block-scroll"
        >
          <pre
            className="qx-code-block-code"
            data-numbers={(lineNumbers ?? several) ? "" : undefined}
            data-wrap={wrap ? "" : undefined}
          >
            <code>
              {lines.map((line, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lines are positions in the code
                <span key={index} className="qx-code-block-line">
                  {/* One box for the line's code, beside its number. */}
                  <span className="qx-code-block-text">
                    {line.map((token, at) =>
                      token.kind === "plain" ? (
                        token.text
                      ) : (
                        // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positions in the line
                        <span key={at} data-token={token.kind}>
                          {token.text}
                        </span>
                      ),
                    )}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </section>
        {!header && copy}
      </div>
    </div>
  );
}
