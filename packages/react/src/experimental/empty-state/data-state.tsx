"use client";

import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import type { ReactElement, ReactNode } from "react";
import { Button } from "../../button/button";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { Spinner } from "../../spinner/spinner";
import { EmptyState } from "./empty-state";

export interface DataStateProps {
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
  /** The content, shown when it's loaded and not empty. */
  children?: ReactNode;
  /** The error state's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["dataState"]>;
}

/**
 * The four states of loaded content in one place (07-components.md, C1): loading, then error, then
 * empty, then the content.
 */
export function DataState({
  loading,
  error,
  empty,
  emptyState,
  onRetry,
  children,
  messages,
}: DataStateProps): ReactElement {
  const strings = useMessages("dataState", messages);
  const spinner = useMessages("spinner");
  if (loading) {
    return (
      <div className="qx-data-state" data-slot="data-state" aria-busy="true">
        <Spinner size="lg" label={spinner.label} />
      </div>
    );
  }
  if (error) {
    return (
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
  }
  if (empty) return <>{emptyState}</>;
  return <>{children}</>;
}
