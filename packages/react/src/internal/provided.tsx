"use client";

import type { ReactNode } from "react";
import { formatNumber } from "../format/format";
import { useLocale, useMessages } from "../provider/provider";
import type { QeetrixMessages } from "./messages";

/**
 * Client leaves that read QeetrixProvider for a server-safe component. The component itself stays
 * free of client code, so it still renders in React Server Components, and puts one of these where
 * the string or number goes; only the leaf crosses into the client.
 */

export interface ProvidedMessageProps<Group extends keyof QeetrixMessages> {
  /** The catalogue group, e.g. `skipLink`. */
  group: Group;
  /** The string's key in the group. */
  name: keyof QeetrixMessages[Group];
  /** The component's own strings, which win over the provider's. */
  own?: Partial<QeetrixMessages[Group]> | undefined;
}

/** A catalogue string: the component's own, then QeetrixProvider's, then the English default. */
export function ProvidedMessage<Group extends keyof QeetrixMessages>({
  group,
  name,
  own,
}: ProvidedMessageProps<Group>): ReactNode {
  return useMessages(group, own)[name] as string;
}

/** A number formatted in QeetrixProvider's locale (`en-IN` without one). */
export function ProvidedNumber({ value }: { value: number }): ReactNode {
  return formatNumber(value, useLocale());
}
