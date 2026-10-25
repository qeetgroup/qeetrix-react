import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { CircleXIcon } from "@qeetrix/icons/icons/circle-x";
import { FingerprintPatternIcon } from "@qeetrix/icons/icons/fingerprint-pattern";
import { InfoIcon } from "@qeetrix/icons/icons/info";
import { KeyIcon } from "@qeetrix/icons/icons/key";
import { LogInIcon } from "@qeetrix/icons/icons/log-in";
import { TriangleAlertIcon } from "@qeetrix/icons/icons/triangle-alert";
import { UserCogIcon } from "@qeetrix/icons/icons/user-cog";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Card } from "../../card/card";
import type { QeetrixIcon } from "../../internal/control";
import {
  Timeline,
  TimelineGroup,
  TimelineItem,
  type TimelineTone,
  type TimelineVariant,
} from "./timeline";

const TONES: [TimelineTone, string, QeetrixIcon][] = [
  ["neutral", "Viewed the invoice", LogInIcon],
  ["brand", "Invited to Acme", KeyIcon],
  ["info", "Exported 1,284 users", InfoIcon],
  ["success", "Payment received", CircleCheckIcon],
  ["warning", "Card expires soon", TriangleAlertIcon],
  ["danger", "Payment failed", CircleXIcon],
];

function Tones({ variant }: { variant?: TimelineVariant }) {
  return (
    <Timeline aria-label="Tones" {...(variant ? { variant } : {})}>
      {TONES.map(([tone, title, icon]) => (
        <TimelineItem
          key={tone}
          tone={tone}
          icon={icon}
          title={title}
          description={`tone="${tone}"`}
          time="09:12"
        />
      ))}
    </Timeline>
  );
}

function Activity({ variant }: { variant?: TimelineVariant }) {
  return (
    <Timeline aria-label="Recent activity" {...(variant ? { variant } : {})}>
      <TimelineGroup label="Today">
        <TimelineItem
          icon={LogInIcon}
          title="Signed in with a passkey"
          description="Bengaluru, India · Chrome on macOS"
          time="2 min ago"
          dateTime="2026-10-25T09:28:00Z"
        />
        <TimelineItem
          icon={CircleXIcon}
          tone="danger"
          title="Failed sign-in"
          description="Wrong password · Mumbai, India"
          time="09:12"
        />
      </TimelineGroup>
      <TimelineGroup label="Yesterday">
        <TimelineItem
          icon={FingerprintPatternIcon}
          title="Added a passkey"
          description="MacBook Pro · Touch ID"
          time="18:40"
        />
        <TimelineItem
          icon={UserCogIcon}
          title="Role changed to Admin"
          description="By Rahul Verma"
          time="11:05"
        />
      </TimelineGroup>
    </Timeline>
  );
}

describe("Timeline", () => {
  it("is an ordered list of events, grouped by day", async () => {
    await render(<Activity />);
    const list = page.getByRole("list", { name: "Recent activity" });
    await expect.element(list).toBeVisible();
    expect(list.element().tagName).toBe("OL");
    await expect.element(page.getByText("Today")).toBeVisible();
    expect(document.querySelectorAll(".qx-timeline-item")).toHaveLength(4);
    expect(document.querySelectorAll(".qx-timeline-group")).toHaveLength(2);
  });

  it("gives an event a machine-readable time when it has a date", async () => {
    await render(<Activity />);
    const time = document.querySelector("time") as HTMLTimeElement;
    expect(time.dateTime).toBe("2026-10-25T09:28:00Z");
    expect(time.textContent).toBe("2 min ago");
  });

  it("colours failures danger, and joins events with a line, broken between days", async () => {
    await render(<Activity />);
    const failed = page.getByText("Failed sign-in").element();
    expect(getComputedStyle(failed).color).toBe(tokenColor("--qx-color-text-danger"));
    const items = [...document.querySelectorAll<HTMLElement>(".qx-timeline-item")];
    const line = (item: HTMLElement) => getComputedStyle(item, "::after").content;
    expect(line(items[0] as HTMLElement)).not.toBe("none");
    // The last event of a day has no line down to the next day.
    expect(line(items[1] as HTMLElement)).toBe("none");
  });

  it("shows dots in the compact variant", async () => {
    await render(<Activity variant="compact" />);
    const marker = document.querySelector(".qx-timeline-marker") as HTMLElement;
    expect(marker.getBoundingClientRect().width).toBe(6);
    expect(getComputedStyle(marker.querySelector("svg") as SVGElement).display).toBe("none");
  });

  it("centres the compact dot on the title's line, not on the two-line event", async () => {
    await render(
      <div style={{ inlineSize: 320, font: "var(--qx-typography-body-md)" }}>
        <Activity variant="compact" />
      </div>,
    );
    for (const item of document.querySelectorAll<HTMLElement>(".qx-timeline-item")) {
      const dot = (
        item.querySelector("[data-slot=timeline-marker]") as HTMLElement
      ).getBoundingClientRect();
      const title = (
        item.querySelector("[data-slot=timeline-title]") as HTMLElement
      ).getBoundingClientRect();
      const event = item.getBoundingClientRect();
      // Two lines: the title over its description.
      expect(event.height).toBeGreaterThan(title.height * 1.5);
      expect(title.height).toBe(20);
      expect(
        Math.abs(dot.top + dot.height / 2 - (title.top + title.height / 2)),
      ).toBeLessThanOrEqual(0.5);
    }
  });

  it("colours the marker for every tone, compact dots included, as Badge names them", async () => {
    const { rerender } = await render(<Tones />);
    const markers = () => [
      ...document.querySelectorAll<HTMLElement>("[data-slot=timeline-marker]"),
    ];
    const expected = (tone: TimelineTone) =>
      tone === "neutral" ? "--qx-color-icon-subtle" : (`--qx-color-icon-${tone}` as const);
    markers().forEach((marker, index) => {
      const tone = TONES[index]?.[0] ?? "neutral";
      expect(getComputedStyle(marker).color, tone).toBe(tokenColor(expected(tone)));
    });
    await rerender(<Tones variant="compact" />);
    markers().forEach((marker, index) => {
      const tone = TONES[index]?.[0] ?? "neutral";
      expect(getComputedStyle(marker).backgroundColor, tone).toBe(
        tokenColor(tone === "neutral" ? "--qx-color-border-strong" : expected(tone)),
      );
    });
    // Only a failure colours its title.
    const titles = [...document.querySelectorAll<HTMLElement>("[data-slot=timeline-title]")];
    expect(getComputedStyle(titles[5] as HTMLElement).color).toBe(
      tokenColor("--qx-color-text-danger"),
    );
    expect(getComputedStyle(titles[3] as HTMLElement).color).toBe(
      tokenColor("--qx-color-text-default"),
    );
  });

  it("is accessible in every tone, and looks right in both colour schemes", async () => {
    await page.viewport(900, 520);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 860,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card title="Tones" level={2}>
          <Tones />
        </Card>
        <Card title="Compact" level={2}>
          <Tones variant="compact" />
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Timeline · tones", "[data-qx-stage]");
  });

  it("is accessible and looks right in both colour schemes", async () => {
    await page.viewport(900, 520);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 860,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card title="Recent activity" level={2}>
          <Activity />
        </Card>
        <Card title="Compact" level={2}>
          <Activity variant="compact" />
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Timeline", "[data-qx-stage]");
  });
});
