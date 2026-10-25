"use client";

import { CheckIcon } from "@qeetrix/icons/icons/check";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

export type StepsOrientation = "horizontal" | "vertical";

export interface Step {
  /**
   * The step's name, short: "Configure". Screen readers hear "Completed" or "Not started" after
   * the name of a done or upcoming step.
   */
  label: ReactNode;
  /** A line under the label, in the vertical layout: what the step is, or what was chosen. */
  description?: ReactNode;
}

export interface StepsProps extends Omit<ComponentProps<"ol">, "children"> {
  /** The steps, in order: each a `label` and, for the vertical layout, a `description`. */
  steps: readonly Step[];
  /** The current step's index, from 0; `steps.length` once every step is done. */
  current: number;
  /**
   * `horizontal` for a short wizard; `vertical`, with descriptions, for a longer setup. Default
   * `horizontal`.
   */
  orientation?: StepsOrientation;
  /** Called with a done step's index when it's chosen, to go back to it. Without it, steps are text. */
  onStepSelect?: (index: number) => void;
  /** This list's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["steps"]>;
}

/**
 * Where a person is in a setup of a few steps: done steps filled Ember with a tick, the current
 * one outlined Ember, those to come grey, joined by a line that turns Ember behind them. An
 * ordered list: the current step is `aria-current="step"`, the others are read as Completed or
 * Not started. With `onStepSelect`, done steps are buttons back to themselves; steps ahead never
 * are. Horizontal shows only the current step's label where it's narrow.
 */
export function Steps({
  steps,
  current,
  orientation = "horizontal",
  onStepSelect,
  messages,
  className,
  ...props
}: StepsProps): ReactElement {
  const strings = useMessages("steps", messages);
  return (
    <ol
      aria-label={strings.label}
      {...props}
      className={cx("qx-steps", className)}
      data-slot="steps"
      data-orientation={orientation}
    >
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        const content = (
          <>
            <span className="qx-step-marker" data-slot="step-marker" aria-hidden>
              {state === "done" ? <CheckIcon shape="sharp" size={14} strokeWidth={3} /> : index + 1}
            </span>
            <span className="qx-step-text">
              <span className="qx-step-label">
                {state === "current" ? (
                  step.label
                ) : (
                  // The name and its status in one run of text: a hidden suffix beside the visible
                  // label is its own box, which browsers set off with a space ("Configure , Completed").
                  <>
                    <span aria-hidden>{step.label}</span>
                    <VisuallyHidden>
                      {step.label}, {state === "done" ? strings.done : strings.upcoming}
                    </VisuallyHidden>
                  </>
                )}
              </span>
              {step.description != null && (
                <span className="qx-step-description">{step.description}</span>
              )}
            </span>
          </>
        );
        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are positions in the setup
            key={index}
            className="qx-step"
            data-slot="step"
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            {state === "done" && onStepSelect ? (
              <button type="button" className="qx-step-body" onClick={() => onStepSelect(index)}>
                {content}
              </button>
            ) : (
              <span className="qx-step-body">{content}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
