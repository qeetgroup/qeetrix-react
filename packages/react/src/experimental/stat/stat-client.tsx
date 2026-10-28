"use client";

import type { ReactElement, ReactNode } from "react";
import { formatNumber } from "../../format/format";
import type { QeetrixMessages } from "../../internal/messages";
import { useLocale, useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

/*
 * The two parts of a Stat that read QeetrixProvider. They're client islands, so Stat itself stays
 * server-safe: a server component renders it, and these follow the provider's locale and language.
 */

/** A Stat's numeric value, in the Stat's `locale` or else QeetrixProvider's; money with `currency`. */
export function StatNumber({
  value,
  locale,
  currency,
  format,
}: {
  value: number;
  locale?: string | undefined;
  currency?: string | undefined;
  format?: Intl.NumberFormatOptions | undefined;
}): ReactNode {
  const provided = useLocale();
  const money: Intl.NumberFormatOptions | undefined = currency
    ? {
        style: "currency",
        currency,
        ...(Number.isInteger(value) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
      }
    : undefined;
  return formatNumber(value, locale ?? provided, { ...money, ...format });
}

/** "Loading" in a loading Stat's value, for screen readers, in QeetrixProvider's language. */
export function StatLoading({
  messages,
}: {
  messages?: Partial<QeetrixMessages["stat"]> | undefined;
}): ReactElement {
  const strings = useMessages("stat", messages);
  return <VisuallyHidden>{strings.loading}</VisuallyHidden>;
}
