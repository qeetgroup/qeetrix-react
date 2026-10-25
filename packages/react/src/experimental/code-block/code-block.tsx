"use client";

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { CopyButton } from "../copy-button/copy-button";
import { type CodeLanguage, highlight, type Token } from "./highlight";

export interface CodeBlockProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The code, as it should be copied. */
  code: string;
  /** How to colour it. Default `text`, no colours. */
  language?: CodeLanguage;
  /** The header's label; when not set, the language's name. */
  title?: ReactNode;
  /** Number the lines; when not set, they're numbered when there's more than one. */
  lineNumbers?: boolean;
  /**
   * Wrap long lines instead of scrolling sideways. A wrapped line continues under its own start,
   * its indent kept. Default `false`.
   */
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

/** An indented line in parts: its leading spaces and tabs, the columns they take (a tab is two),
 * the first word after them, and the rest. */
interface IndentedLine {
  indent: string;
  columns: number;
  lead: Token | null;
  rest: Token[];
}

function splitIndent(line: Token[]): IndentedLine {
  const text = line.map((token) => token.text).join("");
  const indent = /^[ \t]*/.exec(text)?.[0] ?? "";
  if (indent === "" || indent === text) return { indent: "", columns: 0, lead: null, rest: line };
  let columns = 0;
  for (const char of indent) columns += char === "\t" ? 2 - (columns % 2) : 1;
  let drop = indent.length;
  const rest: Token[] = [];
  for (const token of line) {
    if (drop >= token.text.length) drop -= token.text.length;
    else {
      rest.push(drop ? { ...token, text: token.text.slice(drop) } : token);
      drop = 0;
    }
  }
  // The first word, up to a space, is the part that must start beside the indent.
  const [first, ...others] = rest as [Token, ...Token[]];
  const cut = first.text.search(/\s/);
  if (cut === -1) return { indent, columns, lead: first, rest: others };
  return {
    indent,
    columns,
    lead: { kind: first.kind, text: first.text.slice(0, cut) },
    rest: [{ kind: first.kind, text: first.text.slice(cut) }, ...others],
  };
}

/** A token: plain text as it is, the rest in a span its colour is keyed on. Tokens are positions in
 * their line, so the key is the position. */
const tokenNode = (token: Token, key: number): ReactNode =>
  token.kind === "plain" ? (
    token.text
  ) : (
    <span key={key} data-token={token.kind}>
      {token.text}
    </span>
  );

/**
 * Code to read and copy: a command, a snippet, a JSON event or XML metadata, in monospace, coloured
 * by the code tokens with our own small highlighter, with one Copy button. More than one line gets
 * a header with the language and the button, and line numbers (drawn by CSS, so copying never
 * picks them up). Long lines scroll sideways in a focusable region, or `wrap` under their own
 * start. Ligatures are off, so code shows exactly as typed.
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
  const numbered = lineNumbers ?? several;
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
            data-numbers={numbered ? "" : undefined}
            data-wrap={wrap ? "" : undefined}
            // The number column fits the largest line number, two digits at least.
            style={
              numbered
                ? ({
                    "--qx-code-digits": Math.max(2, String(lines.length).length),
                  } as CSSProperties)
                : undefined
            }
          >
            <code>
              {lines.map((line, index) => {
                const { indent, columns, lead, rest } = splitIndent(line);
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: lines are positions in the code
                  <span key={index} className="qx-code-block-line">
                    {/* One box for the line's code, beside its number; wrapped, its indent hangs. */}
                    <span
                      className="qx-code-block-text"
                      style={
                        columns ? ({ "--qx-code-indent": columns } as CSSProperties) : undefined
                      }
                    >
                      {indent && <span className="qx-code-block-indent">{indent}</span>}
                      {lead && <span className="qx-code-block-lead">{tokenNode(lead, 0)}</span>}
                      {rest.map(tokenNode)}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        </section>
        {!header && copy}
      </div>
    </div>
  );
}
