import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { Skeleton } from "../../skeleton/skeleton";
import { StatLoading, StatNumber } from "./stat-client";

/** What the note says about the number: `positive`, `negative` or `warning` colour it. */
export type StatTone = "neutral" | "positive" | "negative" | "warning";

export interface StatGroupProps extends ComponentProps<"dl"> {
  /** Stats, side by side in equal ruled cells. */
  children?: ReactNode;
}

export interface StatProps extends Omit<ComponentProps<"div">, "children"> {
  /** What's counted: "Total users". */
  label: ReactNode;
  /**
   * The number. A `number` is formatted for `locale` (as money with `currency`); pass a string for
   * units or percentages.
   */
  value: ReactNode;
  /**
   * An amount of money: the ISO currency code, e.g. `"INR"`. A whole amount shows no fraction,
   * so `1842600` reads ₹18,42,600 in `en-IN`.
   */
  currency?: string;
  /** `Intl.NumberFormat` options for a numeric `value`, over the defaults (and over `currency`'s). */
  format?: Intl.NumberFormatOptions;
  /** One line under the value: the change or the context, e.g. "+38 this week". */
  note?: ReactNode;
  /** Colours the note. Default `neutral`. */
  tone?: StatTone;
  /**
   * Recent values, oldest first, drawn as a small line beside the number. It's decorative: say what
   * matters about the trend in `note`.
   */
  trend?: readonly number[];
  /**
   * A small chart under the note, for a summary band's richer cells: a ShareBar, a BarList, a
   * Meter. It supports the number; the note still says what matters.
   */
  chart?: ReactNode;
  /** A link at the cell's foot, into the list it counts: "Show the 12 below the target". */
  action?: ReactNode;
  /** Default: QeetrixProvider's locale. It formats a numeric `value`. */
  locale?: string;
  /**
   * The number is on its way: placeholders stand in for the value and the note, so the strip keeps
   * its height, the trend waits, and "Loading" is read in the value's place.
   */
  loading?: boolean;
  /** This stat's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["stat"]>;
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
 * Key numbers in a ruled strip: a `<dl>` of Stats in equal cells, at least 200px wide, with rules
 * between them. Where the cells wrap, a rule runs between the rows instead of at their starts, and
 * every row keeps the gutter. In a PageHeader's `summary` it runs edge to edge. Server-safe.
 */
export function StatGroup({ className, ...props }: StatGroupProps): ReactElement {
  return <dl {...props} className={cx("qx-stat-group", className)} data-slot="stat-group" />;
}

/**
 * One number with its label, a note and an optional trend; in a summary band, a small chart and a
 * link into the list as well. Use inside a StatGroup. Server-safe: the
 * number follows QeetrixProvider's locale through a small client part.
 */
export function Stat({
  label,
  value,
  note,
  tone = "neutral",
  trend,
  chart,
  action,
  locale,
  currency,
  format,
  loading = false,
  messages,
  className,
  ...props
}: StatProps): ReactElement {
  const geometry = !loading && trend && trend.length > 1 ? trendGeometry(trend) : undefined;
  return (
    <div
      {...props}
      className={cx("qx-stat", className)}
      data-slot="stat"
      aria-busy={loading || undefined}
    >
      <dt className="qx-stat-label" data-slot="stat-label">
        {label}
      </dt>
      <dd className="qx-stat-value" data-slot="stat-value">
        {loading ? (
          <>
            <Skeleton />
            <StatLoading messages={messages} />
          </>
        ) : typeof value === "number" ? (
          <StatNumber value={value} locale={locale} currency={currency} format={format} />
        ) : (
          value
        )}
      </dd>
      {geometry && (
        <dd className="qx-stat-trend-cell" data-slot="stat-trend-cell">
          <svg
            className="qx-stat-trend"
            data-slot="stat-trend"
            viewBox={`0 0 ${TREND.width} ${TREND.height}`}
            aria-hidden="true"
            focusable="false"
          >
            <path className="qx-stat-trend-area" data-slot="stat-trend-area" d={geometry.area} />
            <path className="qx-stat-trend-line" data-slot="stat-trend-line" d={geometry.line} />
            <circle
              className="qx-stat-trend-end"
              data-slot="stat-trend-end"
              cx={geometry.end.x}
              cy={geometry.end.y}
              r={2.5}
            />
          </svg>
        </dd>
      )}
      {(note != null || loading) && (
        <dd
          className="qx-stat-note"
          data-slot="stat-note"
          data-tone={tone}
          aria-hidden={loading || undefined}
        >
          {loading ? <Skeleton /> : note}
        </dd>
      )}
      {chart != null && !loading && (
        <dd className="qx-stat-chart" data-slot="stat-chart">
          {chart}
        </dd>
      )}
      {action != null && !loading && (
        <dd className="qx-stat-action" data-slot="stat-action">
          {action}
        </dd>
      )}
    </div>
  );
}
