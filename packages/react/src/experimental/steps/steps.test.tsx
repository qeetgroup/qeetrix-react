import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Card } from "../../card/card";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Steps } from "./steps";

const ADD_APP = [
  { label: "Choose type" },
  { label: "Configure" },
  { label: "Assign users" },
  { label: "Review" },
];
const SAML = [
  { label: "Upload IdP metadata", description: "acme-idp-metadata.xml" },
  { label: "Map attributes", description: "Email, name and groups" },
  { label: "Test sign-in", description: "Try it with your account" },
];
const items = () => [...document.querySelectorAll<HTMLElement>(".qx-step")];
const box = (element: Element | null | undefined) =>
  (element as HTMLElement).getBoundingClientRect();
/** What a screen reader reads for a step: its label and status, in one run of hidden text. */
const spoken = (item: Element | undefined) =>
  item?.querySelector("[data-slot=visually-hidden]")?.textContent;

describe("Steps", () => {
  it("is an ordered list: the current step marked, the rest read as Completed or Not started", async () => {
    await render(<Steps steps={ADD_APP} current={1} />);
    const list = page.getByRole("list", { name: "Progress" });
    await expect.element(list).toBeVisible();
    expect(list.element().tagName).toBe("OL");
    const [done, current, next] = items();
    expect(current?.getAttribute("aria-current")).toBe("step");
    // The number is hidden from assistive technology; the label and its status are read.
    expect(spoken(done)).toBe("Choose type, Completed");
    expect(spoken(next)).toBe("Assign users, Not started");
    expect(current?.querySelector("[data-slot=visually-hidden]")).toBeNull();
  });

  it("names a done step 'Configure, Completed', with no space before the comma", async () => {
    await render(<Steps steps={ADD_APP} current={2} onStepSelect={() => {}} />);
    const back = page.getByRole("button", { name: "Configure, Completed", exact: true });
    await expect.element(back).toBeVisible();
    await expect.element(back).toHaveAccessibleName("Configure, Completed");
    // The visible label is hidden from the name, so it isn't read twice.
    expect(back.element().querySelector(".qx-step-label > [aria-hidden]")?.textContent).toBe(
      "Configure",
    );
  });

  it("fills done steps Ember with a tick, outlines the current one, and greys the rest", async () => {
    await render(<Steps steps={ADD_APP} current={1} />);
    const [done, current, next] = items().map(
      (item) => item.querySelector(".qx-step-marker") as HTMLElement,
    );
    expect(getComputedStyle(done as HTMLElement).backgroundColor).toBe(
      tokenColor("--qx-color-bg-brand-bold"),
    );
    expect(done?.querySelector("svg")).not.toBeNull();
    expect(current?.textContent).toBe("2");
    expect(getComputedStyle(current as HTMLElement).boxShadow).toContain(
      tokenColor("--qx-color-border-brand"),
    );
    expect(getComputedStyle(next as HTMLElement).color).toBe(tokenColor("--qx-color-text-subtle"));
  });

  it("shows a step that failed or needs attention, in its tone and in words, over current", async () => {
    await render(
      <Steps
        orientation="vertical"
        current={2}
        steps={[
          { label: "Add the record", status: "done" },
          { label: "Verify the record", status: "failed" },
          { label: "Issue the certificate", status: "attention" },
        ]}
      />,
    );
    await expect.element(page.getByText("Verify the record, Failed")).toBeInTheDocument();
    await expect
      .element(page.getByText("Issue the certificate, Needs attention"))
      .toBeInTheDocument();
    const steps = [...document.querySelectorAll<HTMLElement>("[data-slot=step]")];
    expect(steps.map((step) => step.dataset.state)).toEqual(["done", "failed", "attention"]);
    expect(steps[2]?.getAttribute("aria-current")).toBe("step");
    const marker = (index: number) =>
      getComputedStyle(steps[index]?.querySelector("[data-slot=step-marker]") as HTMLElement);
    expect(marker(1).backgroundColor).toBe(tokenColor("--qx-color-bg-danger-bold"));
    expect(marker(2).backgroundColor).toBe(tokenColor("--qx-color-bg-warning-bold"));
  });

  it("lays horizontal steps along one line, and vertical ones down a column with descriptions", async () => {
    const { rerender } = await render(
      <div style={{ inlineSize: 720 }}>
        <Steps steps={ADD_APP} current={1} />
      </div>,
    );
    const markers = items().map((item) => box(item.querySelector(".qx-step-marker")));
    expect(new Set(markers.map((marker) => Math.round(marker.top))).size).toBe(1);
    // Each label under its marker, centred on it.
    for (const item of items()) {
      const marker = box(item.querySelector(".qx-step-marker"));
      const label = box(item.querySelector(".qx-step-label"));
      expect(label.top).toBeGreaterThanOrEqual(marker.bottom);
      expect(
        Math.abs(label.left + label.width / 2 - (marker.left + marker.width / 2)),
      ).toBeLessThan(1);
    }
    await rerender(
      <div style={{ inlineSize: 360 }}>
        <Steps steps={SAML} current={1} orientation="vertical" />
      </div>,
    );
    const [first, second] = items();
    expect(box(second).top).toBeGreaterThan(box(first).bottom - 1);
    await expect.element(page.getByText("Email, name and groups")).toBeVisible();
  });

  it("lets done steps go back with onStepSelect; steps ahead are never buttons", async () => {
    const onStepSelect = vi.fn();
    await render(<Steps steps={ADD_APP} current={2} onStepSelect={onStepSelect} />);
    await page.getByRole("button", { name: /Configure/ }).click();
    expect(onStepSelect).toHaveBeenCalledWith(1);
    expect(page.getByRole("button").all()).toHaveLength(2);
  });

  it("shows only the current step's label where it's narrow, and keeps the rest readable", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <Steps steps={ADD_APP} current={1} />
      </div>,
    );
    const texts = items().map((item) => box(item.querySelector(".qx-step-text")));
    expect(texts[1]?.width).toBeGreaterThan(1);
    expect(texts[0]?.width).toBeLessThanOrEqual(1);
    expect(spoken(items()[0])).toBe("Choose type, Completed");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Steps steps={[{ label: "प्रकार" }, { label: "सेटिंग" }]} current={1} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("list", { name: "प्रगति" })).toBeVisible();
    expect(spoken(items()[0])).toBe("प्रकार, पूरा हुआ");
  });

  it("is accessible and looks right in both colour schemes", async () => {
    await page.viewport(900, 400);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 860,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card title="Add an application" level={2}>
          <Steps steps={ADD_APP} current={1} onStepSelect={() => {}} />
        </Card>
        <Card title="Set up SAML" level={2}>
          <Steps steps={SAML} current={1} orientation="vertical" />
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Steps", "[data-qx-stage]");
  });
});
