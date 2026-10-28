import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { LinkButton } from "../../button/link-button";
import { Link } from "../../link/link";
import { SiteHeader, SiteNav, SiteNavItem, SiteNavLink } from "./site-header";

function Qeet({ current = "pricing" }: { current?: string }) {
  return (
    <SiteHeader
      brand={<a href="#home">Qeet</a>}
      navigation={
        <SiteNav aria-label="Main">
          <SiteNavItem label="Products" current={current === "id"}>
            <SiteNavLink
              label="Qeet ID"
              description="Passkeys-first sign-in"
              href="#id"
              current={current === "id"}
            />
            <SiteNavLink label="Qeet Pay" description="Payments and GST invoicing" href="#pay" />
          </SiteNavItem>
          <SiteNavItem label="Pricing" href="#pricing" current={current === "pricing"} />
          <SiteNavItem label="Customers" href="#customers" />
        </SiteNav>
      }
      utilities={<Link href="#signin">Sign in</Link>}
      action={<LinkButton href="#start">Start free</LinkButton>}
    />
  );
}

describe("SiteHeader", () => {
  it("is the site's banner: its sections, the current one marked with the Ember bar", async () => {
    await page.viewport(1200, 700);
    await render(<Qeet />);
    await expect.element(page.getByRole("banner")).toBeVisible();
    await expect.element(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    const pricing = page.getByRole("link", { name: "Pricing" });
    await expect.element(pricing).toHaveAttribute("aria-current", "page");
    expect(getComputedStyle(pricing.element()).boxShadow).toContain(
      tokenColor("--qx-color-border-brand"),
    );
    const toggle = document.querySelector(".qx-site-header-toggle") as HTMLElement;
    expect(getComputedStyle(toggle).display).toBe("none");
  });

  it("opens a section's panel, and Escape closes it back to its trigger", async () => {
    await page.viewport(1200, 700);
    await render(<Qeet />);
    const products = page.getByRole("button", { name: "Products" });
    await userEvent.click(products);
    await expect.element(products).toHaveAttribute("aria-expanded", "true");
    await expect.element(page.getByRole("link", { name: /Qeet ID/ })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(products).toHaveAttribute("aria-expanded", "false");
    await expect.element(products).toHaveFocus();
  });

  it("moves the sections into a menu on a narrow screen", async () => {
    await page.viewport(600, 800);
    await render(<Qeet current="id" />);
    const bar = document.querySelector(".qx-site-header-bar > .qx-site-header-nav") as HTMLElement;
    expect(getComputedStyle(bar).display).toBe("none");
    const menu = page.getByRole("button", { name: "Menu" });
    await userEvent.click(menu);
    await expect.element(menu).toHaveAttribute("aria-expanded", "true");
    const products = page.getByRole("button", { name: "Products" });
    await userEvent.click(products);
    await expect
      .element(page.getByRole("link", { name: /Qeet ID/ }))
      .toHaveAttribute("aria-current", "page");
    await expect.element(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 360);
    await render(<Qeet />);
    await userEvent.click(page.getByRole("button", { name: "Products" }));
    await expect.element(page.getByRole("link", { name: /Qeet Pay/ })).toBeVisible();
    await expectAccessible(document.body);
    await screenshotEveryMode("SiteHeader", null);
  });
});
