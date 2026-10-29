"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { MaximizeIcon } from "@qeetrix/icons/icons/maximize";
import { ZoomInIcon } from "@qeetrix/icons/icons/zoom-in";
import { ZoomOutIcon } from "@qeetrix/icons/icons/zoom-out";
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

export interface GraphNode {
  id: string;
  /** Its name, on the node and read out. */
  label: string;
  /** A second line: its type, or how many it holds. */
  meta?: ReactNode;
  /** A 16px icon for its kind. */
  icon?: QeetrixIcon;
  /** The node it's reached through; the one without a parent is the root, at the top. */
  parent?: string;
  /** The relation on the line from its parent: "member", "editor". */
  relation?: string;
}

export interface GraphCanvasProps {
  /** The nodes, a tree: each but the root names its parent. In order: siblings sit in it. */
  nodes: readonly GraphNode[];
  /** Names the graph: "Who can read Q3 plan". */
  "aria-label": string;
  /** The chosen node, marked with the Ember bar. */
  selected?: string;
  /** Called with a node's id when it's chosen (a click, Enter or Space). */
  onSelect?: (id: string) => void;
  /** Default `136`. */
  nodeWidth?: number;
  /** Default `60`. */
  nodeHeight?: number;
  /** This graph's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["graph"]>;
  className?: string;
  style?: CSSProperties;
}

const GAP_X = 12;
const GAP_Y = 44;
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5];

interface Placed extends GraphNode {
  x: number;
  y: number;
  depth: number;
  children: string[];
}

/** A layered tree, top down: each subtree as wide as its leaves, a parent centred over them. */
function layout(nodes: readonly GraphNode[], w: number, h: number) {
  const byId = new Map<string, Placed>(
    nodes.map((node) => [node.id, { ...node, x: 0, y: 0, depth: 0, children: [] }]),
  );
  for (const node of byId.values()) {
    if (node.parent) byId.get(node.parent)?.children.push(node.id);
  }
  const root = nodes.find((node) => !node.parent || !byId.has(node.parent))?.id;
  const slots = new Map<string, number>();
  const width = (id: string): number => {
    const node = byId.get(id);
    const own = node?.children.length ? node.children.reduce((sum, c) => sum + width(c), 0) : 1;
    slots.set(id, own);
    return own;
  };
  const total = root ? width(root) : 0;
  let deepest = 0;
  const place = (id: string, left: number, depth: number) => {
    const node = byId.get(id);
    if (!node) return;
    const own = slots.get(id) ?? 1;
    node.depth = depth;
    node.x = (left + own / 2) * (w + GAP_X) - (w + GAP_X) / 2;
    node.y = depth * (h + GAP_Y);
    deepest = Math.max(deepest, depth);
    let at = left;
    for (const child of node.children) {
      place(child, at, depth + 1);
      at += slots.get(child) ?? 1;
    }
  };
  if (root) place(root, 0, 0);
  return {
    root,
    byId,
    width: Math.max(total * (w + GAP_X) - GAP_X, w),
    height: (deepest + 1) * (h + GAP_Y) - GAP_Y,
  };
}

/**
 * A graph of who or what reaches a node, as a layered tree top down: nodes on the raised surface,
 * 1px elbow lines with their relation, zoom and fit. The nodes are one Tab stop: ↓ goes to a
 * node's first child, ↑ to its parent, ← and → along its siblings; Enter chooses. Each node says
 * what it's reached from, so the graph reads without seeing it.
 */
export function GraphCanvas({
  nodes,
  "aria-label": label,
  selected,
  onSelect,
  nodeWidth = 136,
  nodeHeight = 60,
  messages,
  className,
  style,
}: GraphCanvasProps): ReactElement {
  const strings = useMessages("graph", messages);
  const rtl = useDirection() === "rtl";
  const frame = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const model = layout(nodes, nodeWidth, nodeHeight);
  const [focused, setFocused] = useState<string | undefined>(undefined);
  const stop = focused && model.byId.has(focused) ? focused : (selected ?? model.root);

  // The root sits at the top centre: keep it in view as the graph opens or zooms.
  // biome-ignore lint/correctness/useExhaustiveDependencies: recentres on a new graph or zoom
  useLayoutEffect(() => {
    const el = frame.current;
    if (el) el.scrollLeft = ((el.scrollWidth - el.clientWidth) / 2) * (rtl ? -1 : 1);
  }, [nodes, zoom, rtl]);

  const step = (direction: 1 | -1) => {
    const at = ZOOMS.findIndex((z) => z >= zoom - 0.001);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (at === -1 ? 3 : at) + direction))];
    if (next) setZoom(next);
  };
  const fit = () => {
    const room = frame.current?.clientWidth ?? 0;
    setZoom(room > 0 ? Math.min(1, Math.max(0.5, (room - 16) / model.width)) : 1);
  };

  const move = (event: KeyboardEvent<HTMLButtonElement>, node: Placed) => {
    const siblings = node.parent ? (model.byId.get(node.parent)?.children ?? []) : [node.id];
    const at = siblings.indexOf(node.id);
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const target =
      event.key === "ArrowDown"
        ? node.children[0]
        : event.key === "ArrowUp"
          ? node.parent
          : event.key === forward
            ? siblings[at + 1]
            : event.key === back
              ? siblings[at - 1]
              : undefined;
    if (!target || !model.byId.has(target)) return;
    event.preventDefault();
    setFocused(target);
    frame.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(target)}"]`)?.focus();
  };

  const parents = [...model.byId.values()].filter((node) => node.children.length);
  return (
    <div className={cx("qx-graph", className)} style={style} data-slot="graph">
      <div className="qx-graph-tools">
        <IconButton
          icon={ZoomInIcon}
          aria-label={strings.zoomIn}
          size="sm"
          tone="neutral"
          onClick={() => step(1)}
        />
        <IconButton
          icon={ZoomOutIcon}
          aria-label={strings.zoomOut}
          size="sm"
          tone="neutral"
          onClick={() => step(-1)}
        />
        <IconButton
          icon={MaximizeIcon}
          aria-label={strings.fit}
          size="sm"
          tone="neutral"
          onClick={fit}
        />
      </div>
      <div className="qx-graph-viewport" ref={frame}>
        <div
          className="qx-graph-scroll"
          style={{ blockSize: model.height * zoom + 16, inlineSize: model.width * zoom }}
        >
          <figure
            className="qx-graph-figure"
            aria-label={label}
            style={{
              inlineSize: model.width,
              blockSize: model.height,
              transform: `scale(${zoom})`,
            }}
          >
            <svg
              className="qx-graph-lines"
              viewBox={`0 0 ${model.width} ${model.height}`}
              aria-hidden
            >
              {parents.map((parent) => {
                const kids = parent.children
                  .map((id) => model.byId.get(id))
                  .filter((kid): kid is Placed => kid !== undefined);
                // Mirrored right to left, as the nodes are.
                const cx = (node: Placed) => {
                  const x = node.x + nodeWidth / 2;
                  return rtl ? model.width - x : x;
                };
                const x0 = cx(parent);
                const mid = parent.y + nodeHeight + GAP_Y / 2;
                const xs = kids.map(cx);
                return (
                  <g key={parent.id}>
                    <line x1={x0} y1={parent.y + nodeHeight} x2={x0} y2={mid} />
                    <line x1={Math.min(x0, ...xs)} y1={mid} x2={Math.max(x0, ...xs)} y2={mid} />
                    {kids.map((kid) => (
                      <g key={kid.id}>
                        <line x1={cx(kid)} y1={mid} x2={cx(kid)} y2={kid.y} />
                        {kid.relation && (
                          <text className="qx-graph-relation" x={cx(kid) + 6} y={kid.y - 6}>
                            {kid.relation}
                          </text>
                        )}
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
            {[...model.byId.values()].map((node) => {
              const Icon = node.icon;
              const parent = node.parent ? model.byId.get(node.parent) : undefined;
              const current = selected === node.id;
              // What it's reached from, read after its visible text: "12 members, editor of Q3 plan".
              const reached = parent && (
                <VisuallyHidden>
                  ,{" "}
                  {fill(node.relation ? strings.reachedAs : strings.reached, {
                    parent: parent.label,
                    relation: node.relation ?? "",
                  })}
                </VisuallyHidden>
              );
              return (
                <button
                  key={node.id}
                  type="button"
                  className="qx-graph-node"
                  data-node={node.id}
                  data-root={node.id === model.root ? "" : undefined}
                  data-current={current ? "" : undefined}
                  aria-current={current ? "true" : undefined}
                  tabIndex={node.id === stop ? 0 : -1}
                  style={{
                    insetInlineStart: node.x,
                    insetBlockStart: node.y,
                    inlineSize: nodeWidth,
                    blockSize: nodeHeight,
                  }}
                  onFocus={() => setFocused(node.id)}
                  onKeyDown={(event) => move(event, node)}
                  onClick={() => onSelect?.(node.id)}
                >
                  {Icon && <Icon size={16} aria-hidden />}
                  <span className="qx-graph-node-text">
                    <strong>
                      {node.label}
                      {node.meta == null && reached}
                    </strong>
                    {node.meta != null && (
                      <small>
                        {node.meta}
                        {reached}
                      </small>
                    )}
                  </span>
                </button>
              );
            })}
          </figure>
        </div>
      </div>
    </div>
  );
}
