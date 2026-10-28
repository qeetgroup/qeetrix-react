"use client";

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react";
import { formatNumber } from "../../format/format";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";
import { fill } from "../../internal/template";
import { useLocale, useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

type Strings = Partial<QeetrixMessages["treemap"]>;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A squarified treemap layout (Bruls, Huizing and van Wijk): a rectangle per value, near square,
 * in the order given (largest first reads best), filling `rect`.
 */
export function squarify(values: readonly number[], rect: Rect): Rect[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (!total) return values.map(() => ({ ...rect, w: 0, h: 0 }));
  const sizes = values.map((v) => (v / total) * rect.w * rect.h);
  const out: Rect[] = [];
  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0);
    return Math.max(
      (side * side * Math.max(...row)) / (s * s),
      (s * s) / (side * side * Math.min(...row)),
    );
  };
  const place = (row: number[], r: Rect): Rect => {
    const s = row.reduce((a, b) => a + b, 0);
    if (r.w >= r.h) {
      const w = s / r.h;
      let y = r.y;
      for (const a of row) {
        out.push({ x: r.x, y, w, h: a / w });
        y += a / w;
      }
      return { x: r.x + w, y: r.y, w: r.w - w, h: r.h };
    }
    const h = s / r.w;
    let x = r.x;
    for (const a of row) {
      out.push({ x, y: r.y, w: a / h, h });
      x += a / h;
    }
    return { x: r.x, y: r.y + h, w: r.w, h: r.h - h };
  };
  let r = rect;
  let row: number[] = [];
  for (let i = 0; i < sizes.length; ) {
    const next = [...row, sizes[i] ?? 0];
    const side = Math.min(r.w, r.h);
    if (!row.length || worst(next, side) <= worst(row, side)) {
      row = next;
      i++;
    } else {
      r = place(row, r);
      row = [];
    }
  }
  if (row.length) place(row, r);
  return out;
}

const box = (r: Rect, w: number, h: number): CSSProperties => ({
  insetInlineStart: `${(r.x / w) * 100}%`,
  insetBlockStart: `${(r.y / h) * 100}%`,
  inlineSize: `${(r.w / w) * 100}%`,
  blockSize: `${(r.h / h) * 100}%`,
});

// ---- Treemap ----------------------------------------------------------------------------------

export interface TreemapNode {
  id: string;
  label: string;
  value: number;
  /** `none` for what has no group ("No department"): drawn in graphite. Default `data`. */
  tone?: "data" | "none";
  /** The tile links here: the list filtered to it. */
  href?: string;
  render?: RenderProp;
  /** One level of nodes inside it: a department's teams. */
  children?: readonly Omit<TreemapNode, "children" | "href" | "render">[];
}

export interface TreemapProps extends Omit<ComponentProps<"ul">, "children"> {
  /** The nodes, largest first. */
  nodes: readonly TreemapNode[];
  /** Names the map: "Departments by people". */
  "aria-label": string;
  /** Width over height. Default `3`. */
  aspectRatio?: number;
  /** Default: QeetrixProvider's locale. */
  locale?: string;
  /** This map's strings, over QeetrixProvider's and the English defaults. */
  messages?: Strings;
}

// The map's own units: labels and counts show only where a tile has room for them.
const W = 1000;

/**
 * Parts of a whole, nested one level: a tile per node sized by its value, its children squarified
 * inside it in a deeper tint. A tile's link is its header (so its name starts with what's seen)
 * stretched over the tile; the children are drawn under it and read in its name. Labels and counts
 * show where there's room, the full figures in each tile's name.
 */
export function Treemap({
  nodes,
  aspectRatio = 3,
  locale: localeProp,
  messages,
  className,
  style,
  ...props
}: TreemapProps): ReactElement {
  const strings = useMessages("treemap", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const n = (value: number) => formatNumber(value, locale);
  const H = W / aspectRatio;
  const rects = squarify(
    nodes.map((node) => node.value),
    { x: 0, y: 0, w: W, h: H },
  );
  return (
    <ul
      {...props}
      className={cx("qx-treemap", className)}
      style={{ aspectRatio, ...style }}
      data-slot="treemap"
    >
      {nodes.map((node, index) => {
        const r = rects[index] as Rect;
        const kids = node.children ?? [];
        const name = fill(kids.length ? strings.tileWithChildren : strings.tile, {
          label: node.label,
          value: n(node.value),
          children: kids.map((kid) => `${kid.label} ${n(kid.value)}`).join(", "),
        });
        const head = (
          <>
            <b className="qx-treemap-label">{node.label}</b> <span>{n(node.value)}</span>
          </>
        );
        const inner = { x: 0, y: 0, w: r.w - 8, h: r.h - 30 };
        const kidRects =
          kids.length && r.w > 90 && r.h > 70
            ? squarify(
                kids.map((kid) => kid.value),
                inner,
              )
            : [];
        return (
          <li
            key={node.id}
            className="qx-treemap-tile"
            data-tone={node.tone ?? "data"}
            style={box(r, W, H)}
            title={`${node.label}: ${n(node.value)}`}
          >
            {node.href || node.render ? (
              renderElement("a", node.render, {
                ...(node.href ? { href: node.href } : {}),
                className: "qx-treemap-head",
                "aria-label": name,
                children: head,
              })
            ) : (
              <>
                <span className="qx-treemap-head" aria-hidden>
                  {head}
                </span>
                <VisuallyHidden>{name}</VisuallyHidden>
              </>
            )}
            {kidRects.length > 0 && (
              <span className="qx-treemap-children" aria-hidden>
                {kids.map((kid, at) => {
                  const k = kidRects[at] as Rect;
                  return (
                    <span
                      key={kid.id}
                      className="qx-treemap-child"
                      data-tone={kid.tone ?? "data"}
                      style={box(k, inner.w, inner.h)}
                      title={`${kid.label}: ${n(kid.value)}`}
                    >
                      {k.w > 110 && k.h > 56 && (
                        <span className="qx-treemap-label">{kid.label}</span>
                      )}
                      {k.w > 34 && k.h > 34 && <b className="qx-treemap-value">{n(kid.value)}</b>}
                    </span>
                  );
                })}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---- ProportionalCircles ----------------------------------------------------------------------

export interface CircleItem {
  id: string;
  label: string;
  value: number;
}

export interface CircleGroup {
  id: string;
  /** The row's name: a country. */
  label: ReactNode;
  /** Under the name: "42 people". */
  meta?: ReactNode;
  items: readonly CircleItem[];
  /** `reference` draws the row in graphite, to set it behind the main one. Default `data`. */
  tone?: "data" | "reference";
}

export interface ProportionalCirclesProps extends Omit<ComponentProps<"div">, "children"> {
  /** A row per group (a country), a circle per item (a city), all on one scale. */
  groups: readonly CircleGroup[];
  /** The largest circle's radius, in pixels. Default `40`. */
  maxRadius?: number;
  /** The smallest radius, so a small value stays visible. Default `5`. */
  minRadius?: number;
  /** Default: QeetrixProvider's locale. */
  locale?: string;
  /** These circles' strings, over QeetrixProvider's and the English defaults. */
  messages?: Strings;
}

/**
 * Amounts as circles whose area is true to the value (the radius by its square root, with a
 * floor), a row per group: the count inside a circle big enough to hold it, beside the name
 * otherwise, the name under each. Each circle is said in words for screen readers.
 */
export function ProportionalCircles({
  groups,
  maxRadius = 40,
  minRadius = 5,
  locale: localeProp,
  messages,
  className,
  ...props
}: ProportionalCirclesProps): ReactElement {
  const strings = useMessages("treemap", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const n = (value: number) => formatNumber(value, locale);
  const top = Math.max(1, ...groups.flatMap((group) => group.items.map((item) => item.value)));
  const radius = (value: number) => Math.max(minRadius, maxRadius * Math.sqrt(value / top));
  return (
    <div {...props} className={cx("qx-circles", className)} data-slot="proportional-circles">
      {groups.map((group) => (
        <figure key={group.id} className="qx-circles-group" data-tone={group.tone ?? "data"}>
          <figcaption className="qx-circles-caption">
            <b className="qx-circles-name">{group.label}</b>
            {group.meta != null && <span>{group.meta}</span>}
          </figcaption>
          <ul className="qx-circles-items">
            {group.items.map((item) => {
              const r = radius(item.value);
              const inside = r >= 14;
              return (
                <li
                  key={item.id}
                  className="qx-circles-item"
                  title={`${item.label}: ${n(item.value)}`}
                >
                  <svg width={r * 2} height={r * 2} viewBox={`0 0 ${r * 2} ${r * 2}`} aria-hidden>
                    <circle cx={r} cy={r} r={r - 1} className="qx-circles-dot" />
                    {inside && (
                      <text x={r} y={r + 5} textAnchor="middle" className="qx-circles-count">
                        {n(item.value)}
                      </text>
                    )}
                  </svg>
                  <small className="qx-circles-label" aria-hidden>
                    {inside ? item.label : `${item.label} · ${n(item.value)}`}
                  </small>
                  <VisuallyHidden>
                    {fill(strings.item, { label: item.label, value: n(item.value) })}
                  </VisuallyHidden>
                </li>
              );
            })}
          </ul>
        </figure>
      ))}
    </div>
  );
}
