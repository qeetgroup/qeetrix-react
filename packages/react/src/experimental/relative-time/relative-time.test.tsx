import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { QeetrixProvider } from "../../provider/provider";
import { RelativeTime } from "./relative-time";

const NOW = Date.UTC(2026, 9, 25, 9, 30);
const minutes = (n: number) => NOW - n * 60_000;
const time = (container: HTMLElement) => container.querySelector("time") as HTMLTimeElement;

describe("RelativeTime", () => {
  it("is a <time> with the exact moment, the relative text, and the full date as its title", async () => {
    const { container } = await render(<RelativeTime date={minutes(2)} now={NOW} />);
    expect(time(container).dateTime).toBe(new Date(minutes(2)).toISOString());
    expect(time(container).textContent).toBe("2 minutes ago");
    expect(time(container).title).toMatch(/25 October 2026/);
  });

  it("says yesterday, then switches to a date beyond the threshold", async () => {
    const { container, rerender } = await render(
      <RelativeTime date={minutes(26 * 60)} now={NOW} />,
    );
    expect(time(container).textContent).toBe("yesterday");
    await rerender(<RelativeTime date={minutes(45 * 24 * 60)} now={NOW} />);
    expect(time(container).textContent).toBe("10 Sept 2026");
    // 40 days: a month and a third, which rounds to last month (45 days, a month and a half,
    // rounds up to 2 months ago, as formatRelativeTime rounds).
    await rerender(
      <RelativeTime date={minutes(40 * 24 * 60)} now={NOW} threshold={60 * 24 * 60 * 60_000} />,
    );
    expect(time(container).textContent).toBe("last month");
  });

  it("accepts an ISO string, and speaks the provider's language", async () => {
    const { container } = await render(
      <QeetrixProvider locale="hi-IN">
        <RelativeTime date={new Date(minutes(5)).toISOString()} now={NOW} />
      </QeetrixProvider>,
    );
    expect(time(container).textContent).toBe("5 मिनट पहले");
  });

  it("keeps itself current while it's on screen", async () => {
    const { container } = await render(<RelativeTime date={Date.now() - 50_000} />);
    expect(time(container).textContent).toBe("50 seconds ago");
    // The first refresh comes within 15 seconds and the text moves to a minute.
    await expect.poll(() => time(container).textContent, { timeout: 20_000 }).toBe("1 minute ago");
  }, 25_000);

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <RelativeTime date={minutes(2)} now={NOW} />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("RelativeTime");
  });
});
