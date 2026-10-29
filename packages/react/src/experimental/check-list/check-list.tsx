"use client";

import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { CircleDashedIcon } from "@qeetrix/icons/icons/circle-dashed";
import { CircleXIcon } from "@qeetrix/icons/icons/circle-x";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { Spinner } from "../../spinner/spinner";

export type CheckStatus = "passed" | "failed" | "pending" | "running";

export interface CheckListProps extends Omit<ComponentProps<"div">, "children"> {
  /** The CheckItems. */
  children?: ReactNode;
  /** Under the checks: when they ran, and Run again. */
  footer?: ReactNode;
}

export interface CheckItemProps extends Omit<ComponentProps<"li">, "children" | "title"> {
  /** What's checked: "The certificate is in date". */
  title: ReactNode;
  /** What it found, or what it checks: "Until 23 Aug 2030". */
  detail?: ReactNode;
  /** The result, shown as an icon and in words: Passed, Failed, Not run or Running. */
  status: CheckStatus;
  /** This item's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["checkList"]>;
}

const ICONS = { passed: CircleCheckIcon, failed: CircleXIcon, pending: CircleDashedIcon } as const;

/**
 * A test's checks, each with its result in words as well as its icon, on a ruled sheet with an
 * optional footer: a SAML connection's offline checks, an LDAP test. Results that change while
 * the checks run are announced politely.
 */
export function CheckList({ footer, className, children, ...props }: CheckListProps): ReactElement {
  return (
    <div {...props} className={cx("qx-check-list", className)} data-slot="check-list">
      <ul className="qx-check-list-items" aria-live="polite">
        {children}
      </ul>
      {footer != null && (
        <div className="qx-check-list-footer" data-slot="check-list-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

/** One check: its status icon, title and detail, and its status in words at the end. */
export function CheckItem({
  title,
  detail,
  status,
  messages,
  className,
  ...props
}: CheckItemProps): ReactElement {
  const strings = useMessages("checkList", messages);
  const Icon = status === "running" ? undefined : ICONS[status];
  return (
    <li
      {...props}
      className={cx("qx-check-item", className)}
      data-slot="check-item"
      data-status={status}
    >
      <span className="qx-check-item-icon" aria-hidden>
        {Icon ? <Icon shape="sharp" size={16} /> : <Spinner decorative size="sm" />}
      </span>
      <span className="qx-check-item-text">
        <span className="qx-check-item-title" data-slot="check-item-title">
          {title}
        </span>
        {detail != null && (
          <span className="qx-check-item-detail" data-slot="check-item-detail">
            {detail}
          </span>
        )}
      </span>
      <span className="qx-check-item-status" data-slot="check-item-status">
        {strings[status]}
      </span>
    </li>
  );
}
