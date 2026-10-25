"use client";

import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Button } from "../../button/button";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { Spinner } from "../../spinner/spinner";
import { EmptyState } from "./empty-state";

export interface DataStateProps extends Omit<ComponentProps<"div">, "children"> {
  /** The content is loading. It wins over every other state. */
  loading?: boolean;
  /** Anything truthy shows the error state. The raw error is never shown: log it in the product. */
  error?: unknown;
  /** The content loaded and there's nothing in it. */
  empty?: boolean;
  /** The EmptyState to show when empty. */
  emptyState?: ReactNode;
  /** Adds a "Try again" button to the error state. */
  onRetry?: () => void;
  /** The content, shown as it is (no wrapper) when it's loaded and not empty. */
  children?: ReactNode;
  /** The error state's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["dataState"]>;
}

/**
 * The four states of loaded content in one place: loading, then error, then empty, then the
 * content. The loading, error and empty states are regions it draws (`data-slot="data-state"`, with
 * `data-state` naming which), and they take `className`, `ref` and the other props. The content is
 * yours and renders as it is, so a Table keeps its place in a Card. A load that fails is announced,
 * and the region holds its height from loading to error, so the page doesn't jump.
 */
export function DataState({
  loading,
  error,
  empty,
  emptyState,
  onRetry,
  children,
  messages,
  className,
  ...props
}: DataStateProps): ReactElement {
  const strings = useMessages("dataState", messages);
  const spinner = useMessages("spinner");
  const failure = (
    <EmptyState
      size="section"
      tone="danger"
      icon={CircleAlertIcon}
      title={strings.errorTitle}
      description={strings.errorDescription}
      actions={
        onRetry && (
          <Button variant="soft" onClick={onRetry}>
            {strings.retry}
          </Button>
        )
      }
    />
  );
  const region = (
    state: "loading" | "error" | "empty",
    content: ReactNode,
    attributes: ComponentProps<"div"> = {},
  ) => (
    // A key per state, so each is a new element: an error region that appears is announced.
    <div
      key={state}
      {...props}
      {...attributes}
      className={cx("qx-data-state", className)}
      data-slot="data-state"
      data-state={state}
    >
      {content}
    </div>
  );
  if (loading) {
    return region(
      "loading",
      <>
        <Spinner size="lg" label={spinner.label} className="qx-data-state-spinner" />
        {/* The error state, unseen and unreachable, holds the region at the height it would have if
            the load failed. */}
        <div className="qx-data-state-reserve" data-slot="data-state-reserve" aria-hidden inert>
          {failure}
        </div>
      </>,
      { "aria-busy": true },
    );
  }
  if (error) return region("error", failure, { role: "alert" });
  if (empty) return region("empty", emptyState);
  return <>{children}</>;
}
