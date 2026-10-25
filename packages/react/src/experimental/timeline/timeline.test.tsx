import { CircleXIcon } from "@qeetrix/icons/icons/circle-x";
import { FingerprintPatternIcon } from "@qeetrix/icons/icons/fingerprint-pattern";
import { LogInIcon } from "@qeetrix/icons/icons/log-in";
import { UserCogIcon } from "@qeetrix/icons/icons/user-cog";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Card } from "../../card/card";
import { Timeline, TimelineGroup, TimelineItem, type TimelineVariant } from "./timeline";

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
