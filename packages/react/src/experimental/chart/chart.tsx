"use client";

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react";
import { formatNumber } from "../../format/format";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";
import { fill } from "../../internal/template";
import { useLocale, useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

/**
 * A mark's colour, from the data-viz tokens: `data` (the first categorical colour), a status
 * (`positive`, `negative`, `warning`), `reference` for a muted mark, or a categorical slot.
 */
export type ChartTone =
  | "data"
  | "positive"
  | "negative"
  | "warning"
  | "reference"
  | `categorical-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

const toneColor = (tone: ChartTone = "data") =>
  `var(--qx-color-dataviz-${tone === "data" ? "categorical-1" : tone})`;

type Strings = QeetrixMessages["chart"];

// ---- Sparkline --------------------------------------------------------------------------------

export interface SparklineProps extends Omit<ComponentProps<"svg">, "children" | "values"> {
  /** The values, oldest first. Fewer than two draw nothing. */
  values: readonly number[];
  /** The top of the scale, so several sparklines compare honestly. Default: the largest value. */
  max?: number;
  /** The line's colour. Default `data`. */
  tone?: ChartTone;
  /** Default `120`. */
  width?: number;
  /** Default `36`. */
  height?: number;
  /** A name for the trend, which makes it an image; without one it's decoration beside a number. */
  label?: string;
}

/**
 * A trend beside a key number: a 2px line, a light wash under it and a ringed dot on the latest
 * value. Decoration by default: say what matters about the trend in words beside it.
 */
export function Sparkline({
  values,
  max,
  tone,
  width = 120,
  height = 36,
  label,
  className,
  style,
  ...props
}: SparklineProps): ReactElement | null {
  if (values.length < 2) return null;
  const top = Math.max(max ?? Math.max(...values), 1);
  const pad = 4;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - (Math.max(0, v) / top) * (height - pad * 2);
  const line = values
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const last = values.length - 1;
  return (
    <svg
      {...props}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cx("qx-sparkline", className)}
      style={{ color: toneColor(tone), ...style }}
      data-slot="sparkline"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        d={`${line} L${x(last)},${height - pad} L${x(0)},${height - pad} Z`}
        fill="currentColor"
        opacity={0.1}
      />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last] ?? 0)} r={3.5} className="qx-sparkline-dot" />
    </svg>
  );
}

// ---- ShareBar ---------------------------------------------------------------------------------

export interface ShareBarPart {
  id: string;
  /** Its share of the whole, in any unit: a count. */
  value: number;
  /** Its name, in the legend and in what's read out. */
  label: string;
  /** Default: the categorical colours in order. */
  tone?: ChartTone;
  /** The legend item links here, e.g. to the list filtered to this part. */
  href?: string;
  /** A router link for the legend item, as `href` does. */
  render?: RenderProp;
}

export interface ShareBarProps extends Omit<ComponentProps<"div">, "children"> {
  /** The parts, in their natural order (most recent first, say), not sorted by size. */
  parts: readonly ShareBarPart[];
  /** What the whole is: "Last active". With `legend`, the legend reads the parts. */
  label: string;
  /** A legend under the bar: each part's colour, label and count; parts with an `href` link. */
  legend?: boolean;
  /** Default: QeetrixProvider's locale. It formats the counts. */
  locale?: string;
}

/**
 * Parts of one whole as one bar: each sized by its value, a 2px surface gap between them, 2px
 * corners at its ends. With `legend`, a legend names and counts every part (and can link each); without one, the
 * bar is an image whose name lists them.
 */
export function ShareBar({
  parts,
  label,
  legend = false,
  locale: localeProp,
  className,
  ...props
}: ShareBarProps): ReactElement {
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const shown = parts.filter((part) => part.value > 0);
  const tone = (part: ShareBarPart, index: number): ChartTone =>
    part.tone ?? (`categorical-${(index % 8) + 1}` as ChartTone);
  const said = `${label}: ${parts.map((part) => `${part.label} ${formatNumber(part.value, locale)}`).join(", ")}`;
  return (
    <div {...props} className={cx("qx-share-bar", className)} data-slot="share-bar">
      <div
        className="qx-share-bar-track"
        {...(legend ? { "aria-hidden": true } : { role: "img", "aria-label": said })}
      >
        {shown.map((part) => (
          <span
            key={part.id}
            className="qx-share-bar-part"
            style={{ flexGrow: part.value, background: toneColor(tone(part, parts.indexOf(part))) }}
          />
        ))}
      </div>
      {legend && (
        <ul className="qx-chart-legend" aria-label={label} data-slot="share-bar-legend">
          {parts.map((part, index) => {
            const content = (
              <>
                <span
                  className="qx-chart-swatch"
                  aria-hidden
                  style={{ background: toneColor(tone(part, index)) }}
                />
                <span className="qx-chart-legend-value">{formatNumber(part.value, locale)}</span>
                <span>{part.label}</span>
              </>
            );
            return (
              <li key={part.id} className="qx-chart-legend-item">
                {part.href || part.render
                  ? renderElement("a", part.render, {
                      ...(part.href ? { href: part.href } : {}),
                      className: "qx-chart-legend-link",
                      children: content,
                    })
                  : content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- ColumnChart ------------------------------------------------------------------------------

export interface ColumnChartSeries {
  /** The part's name: "Failed". */
  label: string;
  tone?: ChartTone;
}

export interface ColumnChartColumn {
  id: string;
  /** The period: "27 Oct". */
  label: string;
  /** One value per series, bottom first. */
  values: readonly number[];
  /** The column links here, e.g. to that day's events. */
  href?: string;
}

export interface ColumnChartProps extends Omit<ComponentProps<"div">, "children"> {
  /** The columns, oldest first: a day each, say. */
  columns: readonly ColumnChartColumn[];
  /** The parts each column stacks, bottom first: Succeeded, then Failed on top. */
  series: readonly ColumnChartSeries[];
  /** What the chart shows: "Sign-ins a day". Its name adds the busiest period. */
  label: string;
  /** The top of the scale, so several charts compare honestly. Default: the tallest column. */
  max?: number;
  /** Default `48`. */
  height?: number;
  /** Default: QeetrixProvider's locale. */
  locale?: string;
  /** This chart's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<Strings>;
}

/**
 * A column a period, parts stacked (failures on top in the negative colour, say), on one scale with
 * a 2px gap between columns. It's an image named for what it shows and its busiest period; with
 * `href`s, each column is also a link named for its period and values.
 */
export function ColumnChart({
  columns,
  series,
  label,
  max,
  height = 48,
  locale: localeProp,
  messages,
  className,
  style,
  ...props
}: ColumnChartProps): ReactElement {
  const strings = useMessages("chart", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const totals = columns.map((column) => column.values.reduce((sum, v) => sum + v, 0));
  const top = Math.max(max ?? Math.max(0, ...totals), 1);
  const busiest = totals.indexOf(Math.max(...totals, 0));
  const peak = columns[busiest];
  const name =
    peak && (totals[busiest] ?? 0) > 0
      ? `${label}. ${fill(strings.busiest, { label: peak.label, value: formatNumber(totals[busiest] ?? 0, locale) })}`
      : `${label}. ${strings.none}`;
  const linked = columns.some((column) => column.href);
  return (
    <div
      {...props}
      className={cx("qx-column-chart", className)}
      style={{ "--qx-column-chart-height": `${height}px`, ...style } as CSSProperties}
      data-slot="column-chart"
      {...(linked ? { role: "group", "aria-label": name } : { role: "img", "aria-label": name })}
    >
      {columns.map((column, index) => {
        const parts = column.values.map((value, part) =>
          value > 0 ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: a column's parts are its series, in order
              key={part}
              className="qx-column-chart-part"
              style={{
                blockSize: `${(value / top) * 100}%`,
                background: toneColor(series[part]?.tone ?? (part === 0 ? "data" : "negative")),
              }}
            />
          ) : null,
        );
        const said = `${column.label}: ${column.values
          .map((value, part) => `${series[part]?.label ?? ""} ${formatNumber(value, locale)}`)
          .join(", ")}`;
        return column.href ? (
          <a
            key={column.id}
            href={column.href}
            className="qx-column-chart-column"
            aria-label={said}
          >
            {parts}
          </a>
        ) : (
          <span key={column.id} className="qx-column-chart-column" data-total={totals[index]}>
            {parts}
          </span>
        );
      })}
    </div>
  );
}

// ---- BarList ----------------------------------------------------------------------------------

export interface BarListItem {
  id: string;
  label: ReactNode;
  value: number;
  /** The item links here. */
  href?: string;
  render?: RenderProp;
}

export interface BarListProps extends Omit<ComponentProps<"ul">, "children"> {
  /** The items; they're shown largest first. */
  items: readonly BarListItem[];
  /** Names the list: "Sign-in methods, latest 50". */
  "aria-label": string;
  /** The bars' colour. Default `data`. */
  tone?: ChartTone;
  /** Default: QeetrixProvider's locale. */
  locale?: string;
}

/** Ranked amounts: a bar per item on one scale, with its label and count, largest first. */
export function BarList({
  items,
  tone,
  locale: localeProp,
  className,
  style,
  ...props
}: BarListProps): ReactElement {
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = Math.max(sorted[0]?.value ?? 0, 1);
  return (
    <ul
      {...props}
      className={cx("qx-bar-list", className)}
      style={{ color: toneColor(tone), ...style }}
      data-slot="bar-list"
    >
      {sorted.map((item) => (
        <li key={item.id} className="qx-bar-list-item">
          <span className="qx-bar-list-label">
            {item.href || item.render
              ? renderElement("a", item.render, {
                  ...(item.href ? { href: item.href } : {}),
                  className: "qx-bar-list-link",
                  children: item.label,
                })
              : item.label}
          </span>
          <span className="qx-bar-list-track" aria-hidden>
            <span
              className="qx-bar-list-bar"
              style={{ inlineSize: `${(item.value / top) * 100}%` }}
            />
          </span>
          <span className="qx-bar-list-value">{formatNumber(item.value, locale)}</span>
        </li>
      ))}
    </ul>
  );
}

// ---- SpanChart --------------------------------------------------------------------------------

export interface SpanChartRow {
  id: string;
  /** The row's name: "Chrome on macOS". */
  label: ReactNode;
  /** When the span starts and ends: a Date or a timestamp. */
  start: Date | number;
  end: Date | number;
  /** The span's words for a screen reader: "13 hours ago to 7 hours ago". */
  description: string;
  tone?: ChartTone;
}

export interface SpanChartProps extends Omit<ComponentProps<"ul">, "children"> {
  /** The rows, each a span on the shared axis. */
  rows: readonly SpanChartRow[];
  /** The axis: from when to when. */
  from: Date | number;
  to: Date | number;
  /** Names the chart: "Sessions, the last 14 days". */
  "aria-label": string;
  /** The axis's ends, e.g. "14 days ago" and "Now". */
  axis?: readonly [ReactNode, ReactNode];
}

/**
 * Spans on one time axis, a row each, such as a person's sessions from sign-in to last request
 * over the last 14 days. Each row says its span in words; the bars are decoration.
 */
export function SpanChart({
  rows,
  from,
  to,
  axis,
  className,
  ...props
}: SpanChartProps): ReactElement {
  const start = Number(from);
  const span = Math.max(Number(to) - start, 1);
  const at = (moment: Date | number) => Math.min(Math.max((Number(moment) - start) / span, 0), 1);
  return (
    <div className={cx("qx-span-chart", className)} data-slot="span-chart">
      <ul {...props} className="qx-span-chart-rows">
        {rows.map((row) => {
          const left = at(row.start);
          const width = Math.max(at(row.end) - left, 0.005);
          return (
            <li key={row.id} className="qx-span-chart-row">
              <span className="qx-span-chart-label">
                {row.label}
                <VisuallyHidden>, {row.description}</VisuallyHidden>
              </span>
              <span className="qx-span-chart-track" aria-hidden>
                <span
                  className="qx-span-chart-bar"
                  style={{
                    insetInlineStart: `${left * 100}%`,
                    inlineSize: `${width * 100}%`,
                    background: toneColor(row.tone),
                  }}
                />
              </span>
            </li>
          );
        })}
      </ul>
      {axis && (
        <div className="qx-span-chart-axis" aria-hidden>
          <span>{axis[0]}</span>
          <span>{axis[1]}</span>
        </div>
      )}
    </div>
  );
}

// ---- ChartTooltip and ChartLegend -------------------------------------------------------------

export interface ChartTooltipItem {
  label: ReactNode;
  value: ReactNode;
  tone?: ChartTone;
}

export interface ChartTooltipProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The point's title: its weekday and date, not only the axis label. */
  title: ReactNode;
  /** A row per series: its colour, label and value. */
  items: readonly ChartTooltipItem[];
}

/**
 * A chart's tooltip on the Qeetrix rules, for a chart library's custom tooltip slot (recharts'
 * `content`): the point's own title, then each series' swatch, label and value.
 */
export function ChartTooltip({
  title,
  items,
  className,
  ...props
}: ChartTooltipProps): ReactElement {
  return (
    <div {...props} className={cx("qx-chart-tooltip", className)} data-slot="chart-tooltip">
      <div className="qx-chart-tooltip-title">{title}</div>
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the series, in order
        <div key={index} className="qx-chart-tooltip-row">
          <span
            className="qx-chart-swatch"
            aria-hidden
            style={{ background: toneColor(item.tone) }}
          />
          <span className="qx-chart-tooltip-label">{item.label}</span>
          <span className="qx-chart-tooltip-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export interface ChartLegendProps extends Omit<ComponentProps<"ul">, "children"> {
  /** Each series: its colour and name. */
  items: readonly { label: ReactNode; tone?: ChartTone }[];
}

/** A chart's legend: each series' colour and name, in a row. */
export function ChartLegend({ items, className, ...props }: ChartLegendProps): ReactElement {
  return (
    <ul {...props} className={cx("qx-chart-legend", className)} data-slot="chart-legend">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the series, in order
        <li key={index} className="qx-chart-legend-item">
          <span
            className="qx-chart-swatch"
            aria-hidden
            style={{ background: toneColor(item.tone) }}
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
