"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { ChevronRightIcon } from "@qeetrix/icons/icons/chevron-right";
import { MinusIcon } from "@qeetrix/icons/icons/minus";
import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";

/** A node in the tree: an organisation unit, a group, a permission. */
export interface TreeNode {
  /** Unique across the tree. */
  id: string;
  label: string;
  /** A 16px icon before the label. */
  icon?: QeetrixIcon;
  /** At the end of the row: a count, a status. */
  meta?: ReactNode;
  children?: readonly TreeNode[];
}

export interface TreeViewProps
  extends Omit<ComponentProps<"ul">, "children" | "onSelect" | "defaultChecked"> {
  /** Names the tree for assistive technology: "Organisation units". */
  label: string;
  items: readonly TreeNode[];
  /** Open nodes' ids, controlled. */
  expanded?: readonly string[];
  /** Open nodes' ids when uncontrolled. */
  defaultExpanded?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** The selected node's id, controlled. Not with `checkable`. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** Each node has a checkbox; a parent is mixed while some of its nodes are on. */
  checkable?: boolean;
  /** The ids of the checked nodes without children, controlled. */
  checked?: readonly string[];
  defaultChecked?: readonly string[];
  onCheckedChange?: (ids: string[]) => void;
}

interface Row {
  node: TreeNode;
  level: number;
  parent: string | null;
  size: number;
  position: number;
}

/** Every id under a node that has no children of its own: what a parent's checkbox stands for. */
const leaves = (node: TreeNode): string[] =>
  node.children?.length ? node.children.flatMap(leaves) : [node.id];

/**
 * A hierarchy to open, close and choose from (07-components.md; the WAI-ARIA tree view):
 * organisation units, nested groups, role permissions. One row is in the Tab order; Up and Down
 * move, Right opens a node or steps into it, Left closes it or steps out to its parent (mirrored
 * right-to-left), Home and End go to the ends, and typing a letter jumps to the next node starting
 * with it. Enter or Space selects a node, or with `checkable` ticks it: a parent ticks all its nodes
 * and shows mixed while only some are on.
 */
export function TreeView({
  label,
  items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  checkable = false,
  checked,
  defaultChecked = [],
  onCheckedChange,
  className,
  ...props
}: TreeViewProps): ReactElement {
  const rtl = useDirection() === "rtl";
  const root = useRef<HTMLUListElement>(null);
  const moveFocus = useRef(false);
  const [ownExpanded, setOwnExpanded] = useState(defaultExpanded);
  const open = new Set(expanded ?? ownExpanded);
  const [ownSelected, setOwnSelected] = useState(defaultSelected);
  const chosen = selected === undefined ? ownSelected : selected;
  const [ownChecked, setOwnChecked] = useState(defaultChecked);
  const on = new Set(checked ?? ownChecked);
  const [focusId, setFocusId] = useState<string | null>(null);

  // The rows on show, in order, with their place in the tree.
  const rows: Row[] = [];
  const walk = (nodes: readonly TreeNode[], level: number, parent: string | null) =>
    nodes.forEach((node, index) => {
      rows.push({ node, level, parent, size: nodes.length, position: index + 1 });
      if (node.children?.length && open.has(node.id)) walk(node.children, level + 1, node.id);
    });
  walk(items, 1, null);
  const ids = rows.map((row) => row.node.id);
  const current =
    (focusId && ids.includes(focusId) && focusId) ||
    (chosen && ids.includes(chosen) && chosen) ||
    ids[0];

  useEffect(() => {
    if (!moveFocus.current || !current) return;
    moveFocus.current = false;
    root.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(current)}"]`)?.focus();
  }, [current]);

  const focus = (id: string | undefined) => {
    if (!id) return;
    moveFocus.current = true;
    setFocusId(id);
  };
  const setOpen = (id: string, next: boolean) => {
    const all = new Set(open);
    if (next) all.add(id);
    else all.delete(id);
    if (expanded === undefined) setOwnExpanded([...all]);
    onExpandedChange?.([...all]);
  };
  const choose = (node: TreeNode) => {
    if (checkable) {
      const under = leaves(node);
      const all = new Set(on);
      const everyOn = under.every((id) => all.has(id));
      for (const id of under) {
        if (everyOn) all.delete(id);
        else all.add(id);
      }
      if (checked === undefined) setOwnChecked([...all]);
      onCheckedChange?.([...all]);
      return;
    }
    if (selected === undefined) setOwnSelected(node.id);
    onSelectedChange?.(node.id);
  };
  const state = (node: TreeNode): boolean | "mixed" => {
    const under = leaves(node);
    const count = under.filter((id) => on.has(id)).length;
    return count === 0 ? false : count === under.length ? true : "mixed";
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const index = ids.indexOf(current ?? "");
    const row = rows[index];
    if (!row) return;
    const parent = Boolean(row.node.children?.length);
    const inward = rtl ? "ArrowLeft" : "ArrowRight";
    const outward = rtl ? "ArrowRight" : "ArrowLeft";
    switch (event.key) {
      case "ArrowDown":
        focus(ids[index + 1]);
        break;
      case "ArrowUp":
        focus(ids[index - 1]);
        break;
      case "Home":
        focus(ids[0]);
        break;
      case "End":
        focus(ids.at(-1));
        break;
      case inward:
        if (parent && !open.has(row.node.id)) setOpen(row.node.id, true);
        else if (parent) focus(ids[index + 1]);
        break;
      case outward:
        if (parent && open.has(row.node.id)) setOpen(row.node.id, false);
        else focus(row.parent ?? undefined);
        break;
      case "Enter":
      case " ":
        choose(row.node);
        break;
      default: {
        // Type a letter: the next node whose label starts with it.
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        const letter = event.key.toLocaleLowerCase();
        const after = [...rows.slice(index + 1), ...rows.slice(0, index)];
        focus(
          after.find((each) => each.node.label.toLocaleLowerCase().startsWith(letter))?.node.id,
        );
      }
    }
    event.preventDefault();
  };

  const render = (nodes: readonly TreeNode[], level: number): ReactNode =>
    nodes.map((node, index) => {
      const hasChildren = Boolean(node.children?.length);
      const isOpen = hasChildren && open.has(node.id);
      const tick = checkable ? state(node) : undefined;
      const Icon = node.icon;
      return (
        <li
          key={node.id}
          role="treeitem"
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={index + 1}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-selected={checkable ? undefined : node.id === chosen}
          aria-checked={tick}
          tabIndex={node.id === current ? 0 : -1}
          data-id={node.id}
          className="qx-tree-item"
          data-slot="tree-item"
          onFocus={(event) => {
            if (event.target === event.currentTarget && node.id !== focusId) setFocusId(node.id);
          }}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: the tree takes its keys on the treeitem; this is the pointer's way in */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: the row is the treeitem's face */}
          <div
            className="qx-tree-row"
            style={{ "--qx-tree-level": level - 1 } as CSSProperties}
            data-selected={!checkable && node.id === chosen ? "" : undefined}
            onClick={() => {
              focus(node.id);
              choose(node);
            }}
          >
            {Array.from({ length: level - 1 }, (_, depth) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: guides are depths
                key={depth}
                className="qx-tree-guide"
                style={{ "--qx-tree-guide": depth } as CSSProperties}
                aria-hidden
              />
            ))}
            <span
              className="qx-tree-toggle"
              aria-hidden
              data-open={isOpen ? "" : undefined}
              onClick={(event) => {
                if (!hasChildren) return;
                event.stopPropagation();
                focus(node.id);
                setOpen(node.id, !isOpen);
              }}
            >
              {hasChildren && <ChevronRightIcon shape="sharp" size={16} />}
            </span>
            {checkable && (
              <span
                className="qx-tree-check"
                aria-hidden
                data-checked={tick === true ? "" : undefined}
                data-mixed={tick === "mixed" ? "" : undefined}
              >
                {tick === true && <CheckIcon shape="sharp" size={12} strokeWidth={3} />}
                {tick === "mixed" && <MinusIcon shape="sharp" size={12} strokeWidth={3} />}
              </span>
            )}
            {Icon && <Icon shape="sharp" size={16} aria-hidden className="qx-tree-icon" />}
            <span className="qx-tree-label">{node.label}</span>
            {node.meta != null && <span className="qx-tree-meta">{node.meta}</span>}
          </div>
          {isOpen && (
            // biome-ignore lint/a11y/useSemanticElements: a treeitem's children are a group, as WAI-ARIA's tree view has them
            <ul role="group" className="qx-tree-group">
              {render(node.children ?? [], level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul
      {...props}
      ref={root}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the WAI-ARIA tree view is a list with role="tree"
      role="tree"
      aria-label={label}
      aria-multiselectable={checkable || undefined}
      className={cx("qx-tree", className)}
      data-slot="tree-view"
      onKeyDown={onKeyDown}
    >
      {render(items, 1)}
    </ul>
  );
}
