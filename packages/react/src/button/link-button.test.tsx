import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Button } from "./button";
import { LinkButton } from "./link-button";

const html = document.documentElement;

describe("LinkButton", () => {
  it("is a link, announced as one, with none of a button's semantics", async () => {
    await render(<LinkButton href="#invoices">View invoices</LinkButton>);
    const link = page.getByRole("link", { name: "View invoices" });
    await expect.element(link).toHaveAttribute("href", "#invoices");
    const el = link.element();
    expect(el.tagName).toBe("A");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.hasAttribute("type")).toBe(false);
    expect(el.hasAttribute("tabindex")).toBe(false);
    expect(page.getByRole("button").elements()).toHaveLength(0);
  });

  it("follows its link on Enter, as links do", async () => {
    await render(<LinkButton href="#reports">Open reports</LinkButton>);
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("link", { name: "Open reports" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(window.location.hash).toBe("#reports");
    window.location.hash = "";
  });

  it("renders a router link through the render prop, keeping its own props", async () => {
    await render(
      <LinkButton render={<a data-router="" href="/users" className="mine" />} variant="soft">
        Users
      </LinkButton>,
    );
    const link = page.getByRole("link", { name: "Users" });
    await expect.element(link).toHaveAttribute("data-router", "");
    await expect.element(link).toHaveAttribute("href", "/users");
    await expect.element(link).toHaveAttribute("data-slot", "link-button");
    await expect.element(link).toHaveAttribute("data-variant", "soft");
    expect(link.element().className).toBe("qx-button mine");
  });

  it("is drawn as a Button: the same height in every density, label first, a sharp icon last", async () => {
    const { container } = await render(
      <Inline gap="sm">
        <Button>Save</Button>
        <LinkButton href="#next" icon={ArrowRightIcon}>
          Next
        </LinkButton>
      </Inline>,
    );
    const button = page.getByRole("button", { name: "Save" }).element() as HTMLElement;
    const link = page.getByRole("link", { name: "Next" }).element() as HTMLElement;
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      expect(link.getBoundingClientRect().height).toBe(button.getBoundingClientRect().height);
    }
    delete html.dataset.qxDensity;
    const label = container.querySelector("a [data-slot=button-label]") as HTMLElement;
    const icon = container.querySelector("a [data-slot=button-icon]") as SVGElement;
    expect(icon.getBoundingClientRect().left).toBeGreaterThan(label.getBoundingClientRect().right);
    expect(icon.getAttribute("stroke-linecap")).toBe("square");
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(link).textDecorationLine).toBe("none");
  });

  it("shows the Ember focus frame on keyboard focus", async () => {
    await render(<LinkButton href="#x">Pricing</LinkButton>);
    await userEvent.keyboard("{Tab}");
    const link = page.getByRole("link", { name: "Pricing" });
    await expect.element(link).toHaveFocus();
    const style = getComputedStyle(link.element());
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="sm">
          <LinkButton href="#a">Create account</LinkButton>
          <LinkButton href="#b" variant="soft" icon={ArrowRightIcon}>
            View plans
          </LinkButton>
          <LinkButton href="#c" variant="ghost" tone="neutral">
            Documentation
          </LinkButton>
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("LinkButton");
  });
});
