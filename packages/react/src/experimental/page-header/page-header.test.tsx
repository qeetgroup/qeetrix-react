import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tab } from "../../../tests/support/keyboard";
import { screenshotEveryMode, screenshotSchemes } from "../../../tests/support/screenshots";
import { Avatar } from "../../avatar/avatar";
import { Badge } from "../../badge/badge";
import { Button } from "../../button/button";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Tab, Tabs, TabsList } from "../../tabs/tabs";
import { AppShell } from "../app-shell/app-shell";
import { Breadcrumb, BreadcrumbItem } from "../breadcrumb/breadcrumb";
import { Stat, StatGroup } from "../stat/stat";
import { PageContent, PageHeader } from "./page-header";
import { PageHeaderBack } from "./page-header-back";

const html = document.documentElement;
afterEach(() => {
  delete html.dataset.qxDensity;
  html.removeAttribute("dir");
});
const rect = (element: Element | null) => (element as HTMLElement).getBoundingClientRect();

function Header({
  tabs = true,
  ...props
}: { tabs?: boolean } & Partial<Parameters<typeof PageHeader>[0]>) {
  return (
    <Tabs defaultValue="all">
      <PageHeader
        {...props}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="#directory">Directory</BreadcrumbItem>
            <BreadcrumbItem current>Users</BreadcrumbItem>
          </Breadcrumb>
        }
        title="Users"
        count={1284}
        status={<Badge tone="success">Directory synced</Badge>}
        description="People who can sign in to Acme Pvt Ltd's applications."
        actions={
          <>
            <Button variant="soft" icon={DownloadIcon}>
              Export
            </Button>
            <Button icon={PlusIcon}>Invite users</Button>
          </>
        }
        summary={
          <StatGroup>
            <Stat label="Total users" value={1284} note="+38 this week" tone="positive" />
            <Stat label="Pending invitations" value={64} note="9 expire this week" tone="warning" />
          </StatGroup>
        }
        tabs={
          tabs ? (
            <TabsList>
              <Tab value="all">All users</Tab>
              <Tab value="invitations">Invitations</Tab>
            </TabsList>
          ) : undefined
        }
      />
      <PageContent>content</PageContent>
    </Tabs>
  );
}

describe("PageHeader", () => {
  it("has the page's one h1, with its count formatted", async () => {
    const { container } = await render(<Header />);
    await expect.element(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    expect(container.querySelector("[data-slot=page-header-count]")?.textContent).toBe("1,284");
  });

  // Shown inside another page, it takes that page's outline, and looks the same.
  it("takes a heading level, for a PageHeader shown inside another page", async () => {
    const { container } = await render(
      <div>
        <PageHeader title="Users" />
        <PageHeader title="Invoices" headingLevel={3} />
      </div>,
    );
    await expect.element(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    await expect.element(page.getByRole("heading", { level: 3, name: "Invoices" })).toBeVisible();
    expect(page.getByRole("heading", { level: 1 }).elements()).toHaveLength(1);
    const [h1, h3] = [...container.querySelectorAll<HTMLElement>("h1, h3")];
    expect(getComputedStyle(h3 as HTMLElement).font).toBe(getComputedStyle(h1 as HTMLElement).font);
  });

  it("runs its summary edge to edge, with the first number on the page gutter", async () => {
    await page.viewport(1000, 400);
    const { container } = await render(<Header />);
    const header = container.querySelector("[data-slot=page-header]") as HTMLElement;
    const summary = container.querySelector("[data-slot=page-header-summary]") as HTMLElement;
    expect(summary.getBoundingClientRect().left).toBe(header.getBoundingClientRect().left);
    expect(summary.getBoundingClientRect().width).toBe(header.getBoundingClientRect().width);
    const first = summary.querySelector("[data-slot=stat]") as HTMLElement;
    expect(getComputedStyle(first).paddingInlineStart).toBe(
      getComputedStyle(header).paddingInlineStart,
    );
  });

  it("puts the first tab label on the gutter and runs the tabs' rule edge to edge, at every density", async () => {
    for (const [width, gutter] of [
      [1000, 32],
      [600, 16],
    ] as const) {
      await page.viewport(width, 400);
      const screen = await render(<Header />);
      const header = rect(document.querySelector("[data-slot=page-header]"));
      const list = document.querySelector("[data-slot=tabs-list]") as HTMLElement;
      for (const density of ["compact", "default", "comfortable"]) {
        html.dataset.qxDensity = density;
        const where = `${width}px, ${density}`;
        const label = rect(list.querySelector("[data-slot=tab-label]"));
        expect(Math.abs(label.left - (header.left + gutter)), where).toBeLessThanOrEqual(0.5);
        // The rule is the list's own edge, so the list spans the band like the summary.
        expect(Math.abs(rect(list).left - header.left), where).toBeLessThanOrEqual(0.5);
        expect(Math.abs(rect(list).right - header.right), where).toBeLessThanOrEqual(0.5);
        const summary = rect(document.querySelector("[data-slot=page-header-summary]"));
        expect(rect(list).width, where).toBe(summary.width);
        // The Ember bar still sits under the first tab, once it has followed the new padding.
        const tab = rect(list.querySelector("[data-slot=tab]"));
        await expect
          .poll(() =>
            Math.abs(rect(list.querySelector("[data-slot=tabs-indicator]")).left - tab.left),
          )
          .toBeLessThanOrEqual(0.5);
      }
      delete html.dataset.qxDensity;
      await screen.unmount();
    }
  });

  it("links back to the parent page above the title, named for screen readers", async () => {
    await page.viewport(1000, 400);
    const { rerender } = await render(
      <PageHeader
        back={<PageHeaderBack href="#users">Users</PageHeaderBack>}
        title="Priya Sharma"
      />,
    );
    const back = page.getByRole("link", { name: "Back to Users" });
    await expect.element(back).toHaveAttribute("href", "#users");
    await expect.element(back).toHaveTextContent("Users");
    const title = page.getByRole("heading", { level: 1, name: "Priya Sharma" });
    expect(rect(back.element()).bottom).toBeLessThanOrEqual(rect(title.element()).top);
    // Its arrow sits on the title's start edge, the gutter.
    const arrow = rect(back.element().querySelector("svg"));
    expect(Math.abs(arrow.left - rect(title.element()).left)).toBeLessThanOrEqual(0.5);
    // Without a name it says "Back"; a router link comes through `render`.
    await rerender(
      <PageHeader
        back={<PageHeaderBack render={<a href="/users" data-router="" />} />}
        title="Priya Sharma"
      />,
    );
    const plain = page.getByRole("link", { name: "Back" });
    await expect.element(plain).toHaveAttribute("data-router", "");
    await expect.element(plain).toHaveAttribute("href", "/users");
    await expect.element(plain).toHaveAttribute("data-slot", "page-header-back");
  });

  it("speaks Hindi, and points its arrow the reading way, right to left", async () => {
    html.dir = "rtl";
    await render(
      <QeetrixProvider locale="hi-IN" direction="rtl" messages={hi}>
        <PageHeader
          back={<PageHeaderBack href="#users">उपयोगकर्ता</PageHeaderBack>}
          title="प्रिया शर्मा"
        />
      </QeetrixProvider>,
    );
    const back = page.getByRole("link", { name: "उपयोगकर्ता पर वापस जाएँ" });
    await expect.element(back).toBeVisible();
    expect(getComputedStyle(back.element().querySelector("svg") as SVGElement).scale).toBe("-1 1");
  });

  it("formats its count in QeetrixProvider's locale", async () => {
    const { container } = await render(
      <QeetrixProvider locale="en-US">
        <PageHeader title="Payments" count={128400} />
      </QeetrixProvider>,
    );
    expect(container.querySelector("[data-slot=page-header-count]")?.textContent).toBe("128,400");
  });

  it("ends on its summary's rule when there are no tabs", async () => {
    const { container } = await render(<Header tabs={false} />);
    const header = container.querySelector("[data-slot=page-header]") as HTMLElement;
    expect(header.dataset.foot).toBe("summary");
    expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 360);
    const { container } = await render(<Header />);
    await expectAccessible(container);
    await screenshotSchemes("PageHeader", "[data-slot=page-header]");
  });

  it("with a back link, is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 240);
    const { container } = await render(
      <PageHeader
        back={<PageHeaderBack href="#users">Users</PageHeaderBack>}
        title="Priya Sharma"
        status={<Badge tone="success">Active</Badge>}
        description="priya@acme.in · Engineering"
        actions={<Button variant="soft">Reset password</Button>}
      />,
    );
    await expectAccessible(container);
    await screenshotSchemes("PageHeader · back link", "[data-slot=page-header]");
  });
});

describe("PageHeader's leading", () => {
  it("puts a record's picture before its title, outside the heading, its top on the title's", async () => {
    await render(
      <PageHeader
        leading={<Avatar name="Acme Retail" shape="square" size="lg" decorative />}
        title="Acme Retail"
        description="acme.example · Enterprise"
      />,
    );
    const heading = page.getByRole("heading", { level: 1 });
    await expect.element(heading).toHaveAccessibleName("Acme Retail");
    const avatar = document.querySelector("[data-slot=avatar]") as HTMLElement;
    expect(heading.element().contains(avatar)).toBe(false);
    const a = avatar.getBoundingClientRect();
    const h = heading.element().getBoundingClientRect();
    expect(a.right).toBeLessThan(h.left);
    expect(Math.round(a.top)).toBe(Math.round(h.top));
  });
});

/** A page that keeps its summary's state itself, as a console keeps it per page. */
function RememberedSummary({ onChange }: { onChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Header
      summaryOpen={open}
      onSummaryOpenChange={(next) => {
        onChange(next);
        setOpen(next);
      }}
    />
  );
}

describe("PageHeader's summary on a phone (below 600px)", () => {
  const strip = () => page.getByRole("button", { name: "Summary" });
  const band = () => document.querySelector("[data-slot=page-header-summary]") as HTMLElement;
  const shown = (element: Element) => getComputedStyle(element).display !== "none";

  it("folds behind a closed Summary disclosure, so the page's content comes first", async () => {
    await page.viewport(390, 800);
    const { container } = await render(<Header />);
    await expect.element(strip()).toHaveAttribute("aria-expanded", "false");
    expect(strip().element().tagName).toBe("BUTTON");
    expect(strip().element().getAttribute("aria-controls")).toBe(band().id);
    expect(shown(band())).toBe(false);
    await expect.element(page.getByText("Total users")).not.toBeVisible();
    // The header, then the closed strip, then the tabs and the page's content.
    const top = (element: Element) => rect(element).top;
    const title = page.getByRole("heading", { level: 1 }).element();
    const content = container.querySelector("[data-slot=page-content]") as HTMLElement;
    expect(top(title)).toBeLessThan(top(strip().element()));
    expect(top(strip().element())).toBeLessThan(top(content));
    expect(top(content) - rect(strip().element()).bottom).toBeLessThan(80);
    // The strip takes the band's place: edge to edge, between the band's rules.
    const header = container.querySelector("[data-slot=page-header]") as HTMLElement;
    expect(rect(strip().element()).left).toBe(rect(header).left);
    expect(rect(strip().element()).width).toBe(rect(header).width);
    const style = getComputedStyle(strip().element());
    expect([style.borderTopWidth, style.borderBottomWidth]).toEqual(["1px", "1px"]);
    await expectAccessible(container);
  });

  it("opens from the keyboard, the band under the strip sharing its rule", async () => {
    await page.viewport(390, 800);
    await render(<Header />);
    // In the tab order after the actions.
    (page.getByRole("button", { name: "Invite users" }).element() as HTMLElement).focus();
    await tab();
    await expect.element(strip()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(strip()).toHaveAttribute("aria-expanded", "true");
    expect(shown(band())).toBe(true);
    await expect.element(page.getByText("Total users")).toBeVisible();
    expect(Math.abs(rect(band()).top - rect(strip().element()).bottom)).toBeLessThanOrEqual(0.5);
    expect(getComputedStyle(band()).borderTopWidth).toBe("0px");
    await userEvent.keyboard(" ");
    await expect.element(strip()).toHaveAttribute("aria-expanded", "false");
    expect(shown(band())).toBe(false);
  });

  it("is named by the word it shows, in the provider's language", async () => {
    await page.viewport(390, 800);
    const { container } = await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Header />
      </QeetrixProvider>,
    );
    const hindi = page.getByRole("button", { name: "सारांश" });
    await expect.element(hindi).toBeVisible();
    expect(hindi.element().textContent).toBe("सारांश");
    expect(hindi.element().hasAttribute("aria-label")).toBe(false);
    await expectAccessible(container);
  });

  it("from 600px shows the band and no strip, whatever its state", async () => {
    await page.viewport(600, 800);
    await render(<Header summaryOpen={false} />);
    expect(shown(band())).toBe(true);
    await expect.element(page.getByText("Total users")).toBeVisible();
    const toggle = document.querySelector("[data-slot=page-header-summary-toggle]") as HTMLElement;
    expect(shown(toggle)).toBe(false);
    expect(page.getByRole("button", { name: "Summary" }).query()).toBeNull();
  });

  it("keeps its state where the page does: summaryOpen and onSummaryOpenChange", async () => {
    await page.viewport(390, 800);
    const onChange = vi.fn();
    const screen = await render(<RememberedSummary onChange={onChange} />);
    await expect.element(strip()).toHaveAttribute("aria-expanded", "true");
    await strip().click();
    expect(onChange).toHaveBeenLastCalledWith(false);
    await expect.element(strip()).toHaveAttribute("aria-expanded", "false");
    await screen.unmount();
    // Held closed by the page, it asks to open and stays closed.
    const held = vi.fn();
    await render(<Header summaryOpen={false} onSummaryOpenChange={held} />);
    await strip().click();
    expect(held).toHaveBeenLastCalledWith(true);
    await expect.element(strip()).toHaveAttribute("aria-expanded", "false");
  });

  it("starts open with defaultSummaryOpen", async () => {
    await page.viewport(390, 800);
    await render(<Header defaultSummaryOpen />);
    await expect.element(strip()).toHaveAttribute("aria-expanded", "true");
    expect(shown(band())).toBe(true);
  });

  it("folds by an embedded AppShell's box, not the window's", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(
      <div style={{ inlineSize: 400, blockSize: 700 }}>
        <AppShell embedded sidebar={<nav aria-label="Qeet ID">Users</nav>}>
          <Header headingLevel={2} />
        </AppShell>
      </div>,
    );
    const toggle = () =>
      container.querySelector("[data-slot=page-header-summary-toggle]") as HTMLElement;
    await expect.poll(() => shown(toggle())).toBe(true);
    expect(shown(band())).toBe(false);
  });

  it("looks right in every mode, closed and open", async () => {
    await page.viewport(390, 520);
    await render(<Header />);
    await screenshotEveryMode("PageHeader · phone · summary closed", "[data-slot=page-header]");
    await strip().click();
    await screenshotEveryMode("PageHeader · phone · summary open", "[data-slot=page-header]");
  });
});

/** A person's record page: three actions and five tabs, in English or with German-length words. */
function PersonPage({ words = "en" }: { words?: "en" | "de" }) {
  const de = words === "de";
  const views = de
    ? ["Übersicht", "Zugriffsrechte", "Sicherheit", "Sitzungen", "Aktivitäten"]
    : ["Overview", "Access", "Security", "Sessions", "Activity"];
  return (
    <Tabs defaultValue={views[4]}>
      <PageHeader
        title="Priya Sharma"
        description="priya@acme.in · Engineering"
        actions={
          <>
            <Button variant="ghost">{de ? "Passwort zurücksetzen" : "Reset password"}</Button>
            <Button variant="soft">{de ? "Konto sperren" : "Suspend"}</Button>
            <Button>{de ? "Profil bearbeiten" : "Edit profile"}</Button>
          </>
        }
        tabs={
          <TabsList>
            {views.map((view) => (
              <Tab key={view} value={view}>
                {view}
              </Tab>
            ))}
          </TabsList>
        }
      />
      <PageContent>content</PageContent>
    </Tabs>
  );
}

describe("PageHeader at 320px (WCAG 1.4.10, reflow)", () => {
  for (const words of ["en", "de"] as const) {
    it(`doesn't scroll the page sideways: the actions wrap under the title, the tabs scroll in their list (${words})`, async () => {
      await page.viewport(320, 720);
      const { container } = await render(<PersonPage words={words} />);
      const root = document.documentElement;
      expect(root.scrollWidth, words).toBeLessThanOrEqual(320);
      const actions = container.querySelector("[data-slot=page-header-actions]") as HTMLElement;
      const title = page.getByRole("heading", { level: 1 }).element();
      expect(rect(actions).top, words).toBeGreaterThanOrEqual(rect(title).bottom);
      for (const button of actions.querySelectorAll("button"))
        expect(rect(button).right, words).toBeLessThanOrEqual(320 - 16 + 0.5);
      // The tabs run past their list, which scrolls; the selected one, the last, is in view.
      const list = container.querySelector("[data-slot=tabs-list]") as HTMLElement;
      expect(list.scrollWidth, words).toBeGreaterThan(list.clientWidth);
      const selected = list.querySelector("[aria-selected=true]") as HTMLElement;
      await expect.poll(() => rect(selected).right <= rect(list).right + 0.5).toBe(true);
      expect(rect(selected).left, words).toBeGreaterThanOrEqual(rect(list).left - 0.5);
      await expectAccessible(container);
    });
  }

  it("keeps the actions on the title's line where they fit", async () => {
    await page.viewport(1100, 600);
    const { container } = await render(<PersonPage />);
    const actions = container.querySelector("[data-slot=page-header-actions]") as HTMLElement;
    const title = page.getByRole("heading", { level: 1 }).element();
    expect(rect(actions).top).toBeLessThan(rect(title).bottom);
    expect(rect(actions).left).toBeGreaterThan(rect(title).right);
    expect(new Set([...actions.querySelectorAll("button")].map((b) => rect(b).top)).size).toBe(1);
  });

  it("looks right at 320px", async () => {
    await page.viewport(320, 720);
    await render(<PersonPage words="de" />);
    await screenshotEveryMode("PageHeader · 320px · longer words", "[data-slot=page-header]");
  });
});
