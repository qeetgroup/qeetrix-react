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
import { mergeRefs } from "../../internal/refs";

/** A node in the tree: an organisation unit, a group, a permission. */
export interface TreeNode {
  /** Unique across the tree. */
  id: string;
  /** The node's name: shown, read out, and matched when a letter is typed. */
  label: string;
  /** A 16px icon before the label. */
  icon?: QeetrixIcon;
  /** At the end of the row: a count, a status. */
  meta?: ReactNode;
  /** The nodes under this one. A node with children opens and closes. */
  children?: readonly TreeNode[];
  /**
   * Shown but unavailable, such as a permission you can't grant: it can't be selected, ticked,
   * opened or closed, the keys skip it, and so does a parent's tick. The nodes under it are
   * unavailable too.
   */
  disabled?: boolean;
}

export interface TreeViewProps
  extends Omit<ComponentProps<"ul">, "children" | "onSelect" | "defaultChecked"> {
  /** Names the tree for assistive technology: "Organisation units". */
  label: string;
  /** The top-level nodes, each with its own `children`. */
  items: readonly TreeNode[];
  /** Open nodes' ids, controlled. */
  expanded?: readonly string[];
  /** Open nodes' ids when uncontrolled. Default `[]`. */
  defaultExpanded?: readonly string[];
  /** Called with every open node's id when a node opens or closes. */
  onExpandedChange?: (ids: string[]) => void;
  /** The selected node's id, controlled. Not with `checkable`. */
  selected?: string | null;
  /** The selected node's id when uncontrolled. Default `null`. */
  defaultSelected?: string | null;
  /** Called with a node's id when it's selected, by Enter, Space or a click. */
  onSelectedChange?: (id: string) => void;
  /** Each node has a checkbox; a parent is mixed while some of its nodes are on. */
  checkable?: boolean;
  /** The ids of the checked nodes without children, controlled. */
  checked?: readonly string[];
  /** The ids of the checked nodes without children, when uncontrolled. Default `[]`. */
  defaultChecked?: readonly string[];
  /** Called with every checked node's id (nodes without children) when a node is ticked. */
  onCheckedChange?: (ids: string[]) => void;
}

interface Row {
  node: TreeNode;
  level: number;
  parent: string | null;
  size: number;
  position: number;
  /** The node, or one above it, is disabled. */
  disabled: boolean;
}

/** Every id under a node that has no children of its own: what a parent's checkbox stands for. */
const leaves = (node: TreeNode): string[] =>
  node.children?.length ? node.children.flatMap(leaves) : [node.id];

/** The leaves a parent's tick can change: those not disabled, nor under a disabled node. */
const available = (node: TreeNode): string[] =>
  node.disabled ? [] : node.children?.length ? node.children.flatMap(available) : [node.id];

/**
 * A hierarchy to open, close and choose from (the WAI-ARIA tree view): organisation units, nested
 * groups, role permissions. One row is in the Tab order; Up and Down move, Right opens a node or
 * steps into it, Left closes it or steps out to its parent (mirrored right-to-left), Home and End go
 * to the ends, and typing a letter jumps to the next node starting with it. Enter or Space selects a
 * node, or with `checkable` ticks it: a parent ticks all its nodes and shows mixed while only some
 * are on. A `disabled` node is shown but skipped.
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
  ref,
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
  const walk = (
    nodes: readonly TreeNode[],
    level: number,
    parent: string | null,
    inherited: boolean,
  ) =>
    nodes.forEach((node, index) => {
      const disabled = inherited || Boolean(node.disabled);
      rows.push({ node, level, parent, size: nodes.length, position: index + 1, disabled });
      if (node.children?.length && open.has(node.id))
        walk(node.children, level + 1, node.id, disabled);
    });
  walk(items, 1, null, false);
  const ids = rows.map((row) => row.node.id);
  const off = new Set(rows.filter((row) => row.disabled).map((row) => row.node.id));
  // The keys move between the nodes that aren't disabled.
  const reachable = ids.filter((id) => !off.has(id));
  const current =
    (focusId && ids.includes(focusId) && focusId) ||
    (chosen && reachable.includes(chosen) && chosen) ||
    reachable[0] ||
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
    if (off.has(node.id)) return;
    if (checkable) {
      const under = available(node);
      if (under.length === 0) return;
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
    const parent = Boolean(row.node.children?.length) && !row.disabled;
    const inward = rtl ? "ArrowLeft" : "ArrowRight";
    const outward = rtl ? "ArrowRight" : "ArrowLeft";
    const after = ids.slice(index + 1).filter((id) => !off.has(id));
    const before = ids.slice(0, index).filter((id) => !off.has(id));
    switch (event.key) {
      case "ArrowDown":
        focus(after[0]);
        break;
      case "ArrowUp":
        focus(before.at(-1));
        break;
      case "Home":
        focus(reachable[0]);
        break;
      case "End":
        focus(reachable.at(-1));
        break;
      case inward:
        // Into the first of its own nodes that isn't disabled.
        if (parent && !open.has(row.node.id)) setOpen(row.node.id, true);
        else if (parent) focus(row.node.children?.find((each) => !each.disabled)?.id);
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
        const around = [...rows.slice(index + 1), ...rows.slice(0, index)];
        focus(
          around.find(
            (each) => !each.disabled && each.node.label.toLocaleLowerCase().startsWith(letter),
          )?.node.id,
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
      const disabled = off.has(node.id);
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
          aria-disabled={disabled || undefined}
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
            data-slot="tree-row"
            style={{ "--qx-tree-level": level - 1 } as CSSProperties}
            data-selected={!checkable && node.id === chosen ? "" : undefined}
            data-disabled={disabled ? "" : undefined}
            // A disabled row doesn't take focus from the pointer either.
            onMouseDown={disabled ? (event) => event.preventDefault() : undefined}
            onClick={() => {
              if (disabled) return;
              focus(node.id);
              choose(node);
            }}
          >
            {Array.from({ length: level - 1 }, (_, depth) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: guides are depths
                key={depth}
                className="qx-tree-guide"
                data-slot="tree-guide"
                style={{ "--qx-tree-guide": depth } as CSSProperties}
                aria-hidden
              />
            ))}
            <span
              className="qx-tree-toggle"
              data-slot="tree-toggle"
              aria-hidden
              data-open={isOpen ? "" : undefined}
              onClick={(event) => {
                if (!hasChildren || disabled) return;
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
                data-slot="tree-check"
                aria-hidden
                data-checked={tick === true ? "" : undefined}
                data-mixed={tick === "mixed" ? "" : undefined}
              >
                {tick === true && <CheckIcon shape="sharp" size={12} strokeWidth={3} />}
                {tick === "mixed" && <MinusIcon shape="sharp" size={12} strokeWidth={3} />}
              </span>
            )}
            {Icon && (
              <Icon
                shape="sharp"
                size={16}
                aria-hidden
                className="qx-tree-icon"
                data-slot="tree-icon"
              />
            )}
            <span className="qx-tree-label" data-slot="tree-label">
              {node.label}
            </span>
            {node.meta != null && (
              <span className="qx-tree-meta" data-slot="tree-meta">
                {node.meta}
              </span>
            )}
          </div>
          {isOpen && (
            // biome-ignore lint/a11y/useSemanticElements: a treeitem's children are a group, as WAI-ARIA's tree view has them
            <ul role="group" className="qx-tree-group" data-slot="tree-group">
              {render(node.children ?? [], level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul
      {...props}
      ref={mergeRefs(ref, root)}
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
