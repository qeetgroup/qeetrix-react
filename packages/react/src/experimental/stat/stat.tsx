import type { ComponentProps, ReactElement, ReactNode } from "react";
import { formatNumber } from "../../format/format";
import { cx } from "../../internal/cx";

/** What the note says about the number: `positive`, `negative` or `warning` colour it. */
export type StatTone = "neutral" | "positive" | "negative" | "warning";

export interface StatGroupProps extends ComponentProps<"dl"> {
  /** Stats, side by side in equal ruled cells. */
  children?: ReactNode;
}

export interface StatProps extends Omit<ComponentProps<"div">, "children"> {
  /** What's counted: "Total users". */
  label: ReactNode;
  /** The number. A `number` is formatted for `locale`; pass a string for units or percentages. */
  value: ReactNode;
  /** One line under the value: the change or the context, e.g. "+38 this week". */
  note?: ReactNode;
  /** Colours the note. Default `neutral`. */
  tone?: StatTone;
  /**
   * Recent values, oldest first, drawn as a small line beside the number. It's decorative: say what
   * matters about the trend in `note`.
   */
  trend?: readonly number[];
  /** The locale for a numeric `value`. Default `en-IN`. */
  locale?: string;
}

const TREND = { width: 88, height: 28, pad: 3 } as const;

/** The trend line and its area, scaled into the box; the last point is marked. */
function trendGeometry(values: readonly number[]) {
  const { width, height, pad } = TREND;
  const min = Math.min(...values);
  const span = Math.max(...values) - min;
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    y: span === 0 ? height / 2 : height - pad - ((value - min) / span) * (height - 2 * pad),
  }));
  const line = points.map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  return {
    line: line.join(" "),
    area: `${line.join(" ")} L${width} ${height} L0 ${height} Z`,
    end: points[points.length - 1] as { x: number; y: number },
  };
}

/**
 * Key numbers in a ruled strip (07-components.md, C1): a `<dl>` of Stats in equal cells with rules
 * between them. In a PageHeader's `summary` it runs edge to edge. Server-safe.
 */
export function StatGroup({ className, ...props }: StatGroupProps): ReactElement {
  return <dl {...props} className={cx("qx-stat-group", className)} data-slot="stat-group" />;
}

/** One number with its label, a note and an optional trend. Use inside a StatGroup. Server-safe. */
export function Stat({
  label,
  value,
  note,
  tone = "neutral",
  trend,
  locale,
  className,
  ...props
}: StatProps): ReactElement {
  const geometry = trend && trend.length > 1 ? trendGeometry(trend) : undefined;
  return (
    <div {...props} className={cx("qx-stat", className)} data-slot="stat">
      <dt className="qx-stat-label" data-slot="stat-label">
        {label}
      </dt>
      <dd className="qx-stat-value" data-slot="stat-value">
        {typeof value === "number" ? formatNumber(value, locale) : value}
      </dd>
      {geometry && (
        <dd className="qx-stat-trend-cell">
          <svg
            className="qx-stat-trend"
            data-slot="stat-trend"
            viewBox={`0 0 ${TREND.width} ${TREND.height}`}
            aria-hidden="true"
            focusable="false"
          >
            <path className="qx-stat-trend-area" d={geometry.area} />
            <path className="qx-stat-trend-line" d={geometry.line} />
            <circle className="qx-stat-trend-end" cx={geometry.end.x} cy={geometry.end.y} r={2.5} />
          </svg>
        </dd>
      )}
      {note != null && (
        <dd className="qx-stat-note" data-slot="stat-note" data-tone={tone}>
          {note}
        </dd>
      )}
    </div>
  );
}
