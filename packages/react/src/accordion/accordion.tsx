"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { HeadingLevel } from "../heading/heading";
import { cx } from "../internal/cx";

export interface AccordionProps<Value = string>
  extends Omit<BaseAccordion.Root.Props<Value>, "className" | "style"> {
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
}

export interface AccordionItemProps
  extends Omit<BaseAccordion.Item.Props, "className" | "style" | "title" | "children"> {
  /** The section's title: the trigger's text. */
  title: ReactNode;
  /** The heading level that wraps the trigger. Default 3. */
  headingLevel?: Exclude<HeadingLevel, 1>;
  /** The section's content. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export type CollapsibleProps = BaseCollapsible.Root.Props;
export type CollapsibleTriggerProps = BaseCollapsible.Trigger.Props;

export interface CollapsiblePanelProps
  extends Omit<BaseCollapsible.Panel.Props, "className" | "style"> {
  className?: string;
  style?: CSSProperties;
}

/**
 * Stacked sections that show and hide, ruled between (06-component-specs.md, increment 5):
 * `value` / `defaultValue` / `onValueChange(value[], details)`, `multiple`, `disabled`.
 */
export function Accordion<Value = string>({
  className,
  ...props
}: AccordionProps<Value>): ReactElement {
  return (
    <BaseAccordion.Root
      {...props}
      className={cx("qx-accordion", className)}
      data-slot="accordion"
    />
  );
}

/**
 * One section: a full-width trigger with a chevron, inside a heading, then the panel. Find in page
 * opens a closed section that holds the match.
 */
export function AccordionItem({
  title,
  headingLevel = 3,
  className,
  children,
  ...props
}: AccordionItemProps): ReactElement {
  const Heading = `h${headingLevel}` as const;
  return (
    <BaseAccordion.Item
      {...props}
      className={cx("qx-accordion-item", className)}
      data-slot="accordion-item"
    >
      <BaseAccordion.Header render={<Heading />} className="qx-accordion-header">
        <BaseAccordion.Trigger className="qx-accordion-trigger" data-slot="accordion-trigger">
          <span className="qx-accordion-title">{title}</span>
          <ChevronDownIcon shape="sharp" size={16} aria-hidden className="qx-accordion-icon" />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel
        hiddenUntilFound
        className="qx-accordion-panel"
        data-slot="accordion-panel"
      >
        <div className="qx-accordion-content">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}

/** One section without the rules, for "Show more" or advanced options. */
export function Collapsible(props: CollapsibleProps): ReactElement {
  return <BaseCollapsible.Root {...props} />;
}

/** Shows and hides the panel. Render your own control: `render={<Button variant="ghost" />}`. */
export function CollapsibleTrigger(props: CollapsibleTriggerProps): ReactElement {
  return <BaseCollapsible.Trigger {...props} />;
}

/** The content that shows and hides, with the accordion's height animation. */
export function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps): ReactElement {
  return (
    <BaseCollapsible.Panel
      {...props}
      className={cx("qx-collapsible-panel", className)}
      data-slot="collapsible-panel"
    />
  );
}
