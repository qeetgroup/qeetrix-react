"use client";

import type { ReactElement, ReactNode } from "react";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { CopyButton } from "../copy-button/copy-button";

type Strings = Partial<QeetrixMessages["codeBlock"]> | undefined;

/** The language's name in the header: "Shell" in the reader's language, format names as they are. */
export function CodeBlockName({
  name,
  messages,
}: {
  name: string | null;
  messages: Strings;
}): ReactNode {
  const strings = useMessages("codeBlock", messages);
  return name ?? strings.shell;
}

/** The block's one Copy button. */
export function CodeBlockCopy({
  code,
  messages,
}: {
  code: string;
  messages: Strings;
}): ReactElement {
  const strings = useMessages("codeBlock", messages);
  return <CopyButton value={code} label={strings.copy} size="sm" />;
}

/**
 * The region that scrolls sideways, named for the block (its title, or "Code"); reachable by
 * keyboard so it can be scrolled, unless the code wraps.
 */
export function CodeBlockScroll({
  label,
  shell,
  wrap,
  messages,
  children,
}: {
  label: string | undefined;
  shell: boolean;
  wrap: boolean;
  messages: Strings;
  children: ReactNode;
}): ReactElement {
  const strings = useMessages("codeBlock", messages);
  return (
    <section
      tabIndex={wrap ? undefined : 0}
      aria-label={label || (shell ? strings.shell : strings.region)}
      className="qx-code-block-scroll"
    >
      {children}
    </section>
  );
}
