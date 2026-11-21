"use client";

import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { type ReactElement, type ReactNode, useId, useState } from "react";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";

export interface SummaryFoldProps {
  children: ReactNode;
  open: boolean | undefined;
  defaultOpen: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
  messages: Partial<QeetrixMessages["pageHeader"]> | undefined;
}

/**
 * PageHeader's summary band, and the strip it folds behind on a phone. Below 600px (an embedded
 * AppShell's box, inside one) the band is hidden behind a "Summary" disclosure, closed by default,
 * so the page's content comes first; from 600px the strip hides and the band shows whatever the
 * state. CSS decides, so a server-rendered page folds before it hydrates. Not part of the API.
 */
export function SummaryFold({
  children,
  open,
  defaultOpen,
  onOpenChange,
  messages,
}: SummaryFoldProps): ReactElement {
  const strings = useMessages("pageHeader", messages);
  const id = useId();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  return (
    <>
      <button
        type="button"
        className="qx-page-header-summary-toggle"
        data-slot="page-header-summary-toggle"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={toggle}
      >
        <span className="qx-page-header-summary-label">{strings.summary}</span>
        <ChevronDownIcon
          shape="sharp"
          size={16}
          aria-hidden
          className="qx-page-header-summary-chevron"
        />
      </button>
      <div
        id={id}
        className="qx-page-header-summary"
        data-slot="page-header-summary"
        data-open={isOpen ? "" : undefined}
      >
        {children}
      </div>
    </>
  );
}
