import { EyeIcon } from "@qeetrix/icons/icons/eye";
import { WrenchIcon } from "@qeetrix/icons/icons/wrench";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { QeetIdFrame } from "../../../tests/fixtures/qeet-id-console";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Button } from "../../button/button";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import type { AppShellDensity } from "../app-shell/app-shell";
import { PageHeader } from "../page-header/page-header";
import { Alert } from "./alert";

describe("Alert", () => {
  it("says its tone in words, not only colour", async () => {
    const { container } = await render(
      <Alert tone="warning" title="Directory sync is behind">
        Users added in Azure AD in the last hour may be missing.
      </Alert>,
    );
    const title = container.querySelector("[data-slot=alert-title]") as HTMLElement;
    expect(title.textContent).toBe("Warning: Directory sync is behind");
  });

  it("isn't announced by default; announces politely or urgently when asked", async () => {
    const { rerender, container } = await render(<Alert title="Saved" />);
    const alert = () => container.querySelector("[data-slot=alert]") as HTMLElement;
    expect(alert().getAttribute("role")).toBeNull();
    await rerender(<Alert title="Saved" announce="polite" />);
    expect(alert().getAttribute("role")).toBe("status");
    await rerender(<Alert title="Couldn't save" tone="danger" announce="urgent" />);
    expect(alert().getAttribute("role")).toBe("alert");
  });

  it("carries actions, and a Dismiss button when it can be dismissed", async () => {
    const onDismiss = vi.fn();
    await render(
      <Alert
        title="Copy this secret now"
        actions={<Button size="sm">Copy secret</Button>}
        onDismiss={onDismiss}
      >
        It won't be shown again.
      </Alert>,
    );
    await expect.element(page.getByRole("button", { name: "Copy secret" })).toBeVisible();
    await page.getByRole("button", { name: "Dismiss" }).click();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("marks its start edge and tints its surface in the tone", async () => {
    const { container } = await render(<Alert tone="danger" title="Sign-in failed" />);
    const style = getComputedStyle(container.querySelector("[data-slot=alert]") as HTMLElement);
    expect(style.borderInlineStartWidth).toBe("3px");
    expect(style.borderInlineStartColor).toBe(tokenColor("--qx-color-icon-danger"));
    expect(style.backgroundColor).toBe(tokenColor("--qx-color-bg-danger-subtle"));
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    const { container } = await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Alert tone="danger" title="साइन-इन विफल" onDismiss={() => {}} />
      </QeetrixProvider>,
    );
    expect(container.querySelector("[data-slot=alert-title]")?.textContent).toBe(
      "त्रुटि: साइन-इन विफल",
    );
    await expect.element(page.getByRole("button", { name: "खारिज करें" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(720, 520);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gap: 12,
          padding: 16,
          inlineSize: 640,
          background: "var(--qx-color-surface-default)",
        }}
      >
        <Alert title="You're in Development">
          Test users only. Sign-ins here don't reach production.
        </Alert>
        <Alert tone="success" title="Directory synced" onDismiss={() => {}}>
          1,284 users are up to date.
        </Alert>
        <Alert
          tone="warning"
          title="Copy this secret now"
          actions={
            <Button size="sm" variant="soft">
              Copy secret
            </Button>
          }
        >
          It's stored hashed and can't be shown again.
        </Alert>
        <Alert
          tone="danger"
          title="Directory sync failed"
          announce="urgent"
          actions={
            <Button size="sm" variant="ghost" tone="neutral">
              View details
            </Button>
          }
        />
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Alert", "[data-qx-stage]");
  });
});

/** The approved mock-up: three page banners over Directory › Users. */
function BannerPage(props: { onDismiss?: () => void; density?: AppShellDensity }) {
  return (
    <QeetIdFrame
      density={props.density ?? "compact"}
      banners={
        <>
          <Alert
            variant="banner"
            tone="warning"
            icon={EyeIcon}
            title="You're viewing as Priya Sharma"
            actions={
              <Button size="sm" tone="neutral">
                Exit
              </Button>
            }
          >
            (priya@acme.in). Anything you change is done as her.
          </Alert>
          <Alert
            variant="banner"
            icon={WrenchIcon}
            title="Maintenance on Sunday 2 November, 01:00–02:00 IST."
            actions={
              <Button size="sm" variant="ghost" tone="neutral">
                Details
              </Button>
            }
            onDismiss={props.onDismiss ?? (() => {})}
          >
            Sign-in keeps working.
          </Alert>
          <Alert variant="banner" tone="danger" title="Your trial ends in 3 days.">
            After that, new sign-ins stop.
          </Alert>
        </>
      }
    >
      <PageHeader
        title="Users"
        description="People who can sign in to Acme Pvt Ltd's applications."
        actions={<Button size="sm">Invite users</Button>}
      />
    </QeetIdFrame>
  );
}

const rect = (element: Element | null) => (element as HTMLElement).getBoundingClientRect();
const banners = () => [...document.querySelectorAll<HTMLElement>("[data-variant=banner]")];
const centre = (r: DOMRect) => r.top + r.height / 2;
/** Within half a pixel: engines lay out in fractions of a pixel. */
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected), `${actual} ≈ ${expected}`).toBeLessThanOrEqual(0.5);

describe("Alert as a page banner", () => {
  it("runs edge to edge under the top bar, on the page's gutter", async () => {
    for (const width of [1280, 640]) {
      await page.viewport(width, 640);
      const screen = await render(<BannerPage />);
      const main = rect(document.querySelector("[data-slot=app-shell-main]"));
      const [first] = banners();
      near(rect(first ?? null).top, rect(document.querySelector(".qx-app-shell-top")).bottom);
      for (const banner of banners()) {
        near(rect(banner).left, main.left);
        near(rect(banner).right, main.right);
      }
      // The icon starts on the page title's line, the last control ends on the header's gutter.
      const title = rect(document.querySelector(".qx-page-header-title"));
      const header = document.querySelector("[data-slot=page-header]") as HTMLElement;
      const end = main.right - Number.parseFloat(getComputedStyle(header).paddingInlineEnd);
      for (const banner of banners()) {
        near(rect(banner.querySelector(".qx-alert-icon")).left, title.left);
        const last = [...banner.querySelectorAll("button")].pop();
        if (last) near(rect(last).right, end);
      }
      await screen.unmount();
    }
  });

  it("is one line on one centre line, every banner the same height", async () => {
    await page.viewport(1280, 640);
    await render(<BannerPage />);
    const heights = new Set(banners().map((banner) => rect(banner).height));
    expect(heights.size).toBe(1);
    for (const banner of banners()) {
      const title = banner.querySelector("[data-slot=alert-title]") as HTMLElement;
      const description = banner.querySelector("[data-slot=alert-description]") as HTMLElement;
      // The title runs into the description: one line box.
      expect(title.getClientRects()).toHaveLength(1);
      near(rect(description).top, rect(title).top);
      expect(rect(description).left).toBeGreaterThan(rect(title).right);
      // The tinted band, less the rule under it, centres the icon, the text and the buttons.
      const band = rect(banner);
      const middle = band.top + (band.height - 1) / 2;
      expect(
        Math.abs(centre(rect(banner.querySelector(".qx-alert-icon"))) - middle),
      ).toBeLessThanOrEqual(0.5);
      expect(Math.abs(centre(rect(title)) - middle)).toBeLessThanOrEqual(0.5);
      for (const button of banner.querySelectorAll("button")) {
        expect(Math.abs(centre(rect(button)) - middle)).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("tints in its tone with a rule under it, not the status edge", async () => {
    await render(<Alert variant="banner" tone="danger" title="Your trial ends in 3 days." />);
    const style = getComputedStyle(banners()[0] as HTMLElement);
    expect(style.borderInlineStartWidth).toBe("0px");
    expect(style.borderBlockEndWidth).toBe("1px");
    expect(style.borderBlockEndColor).toBe(tokenColor("--qx-color-border-danger"));
    expect(style.backgroundColor).toBe(tokenColor("--qx-color-bg-danger-subtle"));
  });

  it("says its tone in words, takes its own icon, and can be dismissed", async () => {
    const onDismiss = vi.fn();
    await page.viewport(1280, 640);
    await render(<BannerPage onDismiss={onDismiss} />);
    const [viewingAs] = banners();
    expect(viewingAs?.querySelector("[data-slot=alert-title]")?.textContent).toBe(
      "Warning: You're viewing as Priya Sharma",
    );
    // The eye, in place of the warning triangle.
    expect(viewingAs?.querySelector(".qx-alert-icon circle")).not.toBeNull();
    await page.getByRole("button", { name: "Dismiss" }).click();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(1040, 420);
    const { container } = await render(<BannerPage density="inherit" />);
    await expectAccessible(container);
    await screenshotEveryMode("Page banner", null);
  });
});
