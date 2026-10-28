"use client";

import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { type ComponentProps, type ReactElement, type ReactNode, useId } from "react";
import { Button, type ButtonProps } from "../../button/button";
import { cx } from "../../internal/cx";
import { Tab, Tabs, TabsList, TabsPanel } from "../../tabs/tabs";

// ---- Toolbar ----------------------------------------------------------------------------------

export interface ToolbarProps extends Omit<BaseToolbar.Root.Props, "className" | "render"> {
  /** Names the toolbar: "Policies". */
  "aria-label": string;
  /** What you're working on, at the start: a picker, a name. */
  start?: ReactNode;
  /** The tool's actions, at the end, the primary last. */
  end?: ReactNode;
  className?: string;
}

/**
 * A row of controls with one Tab stop: the arrow keys move between its ToolbarButtons (Home and
 * End to the ends), Tab leaves it. What you work on sits at the start, the actions at the end; it
 * wraps on narrow screens.
 */
export function Toolbar({ start, end, children, className, ...props }: ToolbarProps): ReactElement {
  return (
    <BaseToolbar.Root {...props} className={cx("qx-toolbar", className)} data-slot="toolbar">
      {start != null && <div className="qx-toolbar-start">{start}</div>}
      {children}
      {end != null && <div className="qx-toolbar-end">{end}</div>}
    </BaseToolbar.Root>
  );
}

/** A Button in a toolbar, reached with the arrow keys. Takes Button's props. */
export function ToolbarButton(props: ButtonProps): ReactElement {
  return <BaseToolbar.Button render={<Button variant="ghost" tone="neutral" {...props} />} />;
}

/** Related buttons, side by side. */
export function ToolbarGroup({
  className,
  ...props
}: Omit<BaseToolbar.Group.Props, "className"> & { className?: string }): ReactElement {
  return (
    <BaseToolbar.Group
      {...props}
      className={cx("qx-toolbar-group", className)}
      data-slot="toolbar-group"
    />
  );
}

/** A 1px rule between groups. */
export function ToolbarSeparator(): ReactElement {
  return <BaseToolbar.Separator className="qx-toolbar-separator" data-slot="toolbar-separator" />;
}

// ---- Workspace --------------------------------------------------------------------------------

export type WorkspaceLayout = "three" | "list-main" | "main-inspector" | "main";

export interface WorkspaceProps extends Omit<ComponentProps<"div">, "children"> {
  /**
   * The panes: `three` is a list, the main canvas and an inspector; or the main canvas with one of
   * them, or alone. Default `three`.
   */
  layout?: WorkspaceLayout;
  /** WorkspacePanes and a WorkspaceMain, in reading order. */
  children?: ReactNode;
}

/**
 * A tool's working surface, under the page header and a Toolbar: ruled panes edge to edge, each
 * scrolling on its own. It fills its box (give it a height: the window under the bar, say); on
 * a narrow box the panes stack.
 */
export function Workspace({ layout = "three", className, ...props }: WorkspaceProps): ReactElement {
  return (
    <div
      {...props}
      className={cx("qx-workspace", className)}
      data-slot="workspace"
      data-layout={layout}
    />
  );
}

export interface WorkspacePaneProps extends Omit<ComponentProps<"section">, "children"> {
  /** `list` at the start or `inspector` at the end. */
  side: "list" | "inspector";
  /** The pane's head, in small capitals: "Policies". It names the pane. */
  label: string;
  /** Beside the label: a count, a status. */
  meta?: ReactNode;
  /** At the head's end: one quiet action. */
  action?: ReactNode;
  /** A ruled foot, for the pane's own actions. */
  footer?: ReactNode;
  children?: ReactNode;
}

/** A side pane: the list or the inspector, with a ruled head and an optional foot. */
export function WorkspacePane({
  side,
  label,
  meta,
  action,
  footer,
  className,
  children,
  ...props
}: WorkspacePaneProps): ReactElement {
  const id = useId();
  return (
    <section
      {...props}
      className={cx("qx-workspace-pane", className)}
      data-slot="workspace-pane"
      data-side={side}
      aria-labelledby={id}
    >
      <header className="qx-workspace-pane-head">
        <span className="qx-workspace-pane-label" id={id}>
          {label}
        </span>
        {meta != null && <span className="qx-workspace-pane-meta">{meta}</span>}
        {action != null && <span className="qx-workspace-pane-action">{action}</span>}
      </header>
      <div className="qx-workspace-pane-body">{children}</div>
      {footer != null && <footer className="qx-workspace-pane-foot">{footer}</footer>}
    </section>
  );
}

export interface WorkspaceMainProps extends Omit<ComponentProps<"section">, "children"> {
  /** Names the canvas: "Policy". */
  "aria-label": string;
  /** A WorkspaceOutput, docked under the canvas. */
  output?: ReactNode;
  children?: ReactNode;
}

/** The centre: the canvas on the canvas tone, with its output docked under it. */
export function WorkspaceMain({
  output,
  className,
  children,
  ...props
}: WorkspaceMainProps): ReactElement {
  return (
    <section
      {...props}
      className={cx("qx-workspace-main", className)}
      data-slot="workspace-main"
      data-output={output != null ? "" : undefined}
    >
      <div className="qx-workspace-canvas">{children}</div>
      {output}
    </section>
  );
}

export interface WorkspaceOutputView<Value extends string> {
  value: Value;
  label: string;
  badge?: ReactNode;
}

export interface WorkspaceOutputProps<Value extends string> {
  /** Names the views: "Result". */
  "aria-label": string;
  /** Views of one result: the decision, the code, the trace. */
  views: readonly WorkspaceOutputView<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  /** At the head's end: a status, a time. */
  end?: ReactNode;
  /** The chosen view. */
  children?: ReactNode;
}

/** The docked output: views of one result as line tabs, the chosen one under them. */
export function WorkspaceOutput<Value extends string>({
  "aria-label": label,
  views,
  value,
  onValueChange,
  end,
  children,
}: WorkspaceOutputProps<Value>): ReactElement {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as Value)}
      className="qx-workspace-output"
    >
      <div className="qx-workspace-output-head">
        <TabsList activateOnFocus={false} aria-label={label}>
          {views.map((view) => (
            <Tab key={view.value} value={view.value} badge={view.badge}>
              {view.label}
            </Tab>
          ))}
        </TabsList>
        {end != null && <div className="qx-workspace-output-end">{end}</div>}
      </div>
      <TabsPanel value={value} className="qx-workspace-output-body">
        {children}
      </TabsPanel>
    </Tabs>
  );
}
