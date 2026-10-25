import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Button } from "../../button/button";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
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

  it("is accessible and looks right in both schemes", async () => {
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
    await screenshotSchemes("Alert", "[data-qx-stage]");
  });
});
