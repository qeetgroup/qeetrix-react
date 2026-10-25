import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Breadcrumb, BreadcrumbItem } from "./breadcrumb";

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbItem href="#users">Users</BreadcrumbItem>
      <BreadcrumbItem href="#priya">Priya Sharma</BreadcrumbItem>
      <BreadcrumbItem current>Sessions and devices from the last ninety days</BreadcrumbItem>
    </Breadcrumb>
  );
}

describe("Breadcrumb", () => {
  it("is a named navigation with an ordered list; the current page is plain text", async () => {
    await render(<Trail />);
    await expect.element(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    expect(document.querySelector("[data-slot=breadcrumb] ol")).not.toBeNull();
    const current = page.getByText(/Sessions and devices/);
    await expect.element(current).toHaveAttribute("aria-current", "page");
    expect(current.element().tagName).toBe("SPAN");
  });

  it("takes another name from aria-label, which wins over the default", async () => {
    await render(
      <Breadcrumb aria-label="You are here">
        <BreadcrumbItem current>Users</BreadcrumbItem>
      </Breadcrumb>,
    );
    await expect.element(page.getByRole("navigation", { name: "You are here" })).toBeVisible();
    expect(page.getByRole("navigation", { name: "Breadcrumb" }).query()).toBeNull();
  });

  it("separates items with decorative chevrons, none before the first", async () => {
    const { container } = await render(<Trail />);
    const separators = [...container.querySelectorAll(".qx-breadcrumb-separator")] as SVGElement[];
    expect(separators.map((s) => getComputedStyle(s).display)).toEqual(["none", "block", "block"]);
    expect(separators.every((s) => s.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("truncates a long label at 240px and keeps its full text as a title", async () => {
    await render(<Trail />);
    const current = page.getByText(/Sessions and devices/).element() as HTMLElement;
    expect(current.getBoundingClientRect().width).toBeLessThanOrEqual(240);
    expect(current.title).toBe("Sessions and devices from the last ninety days");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Trail />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Breadcrumb");
  });
});
