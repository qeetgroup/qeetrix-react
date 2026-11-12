import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Badge } from "../../badge/badge";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { SiteSearch, type SiteSearchProps, type SiteSearchResult } from "./site-search";

const PAGES: SiteSearchResult[] = [
  {
    href: "#qeet-id",
    title: "Qeet ID",
    kind: "Product",
    badge: <Badge tone="success">Active</Badge>,
    description: "The single secure front door to everything an organisation runs.",
  },
  {
    href: "#qeet-id-available",
    title: "Qeet ID is available",
    kind: "Insight",
    description: "After a short private beta, the first Qeet product is running in production.",
    note: "Note added 28 Oct 2026",
  },
  {
    href: "#passwordless",
    title: "Passwordless sign-in is live in Qeet ID",
    kind: "Insight",
    description: "Sign-in without passwords, with the accounts people already have.",
  },
  {
    href: "#qeet-pay",
    title: "Qeet Pay",
    kind: "Product",
    description: "Payments, billing and GST invoicing.",
  },
];

/** The site's own search: every word must be in the title or the description. */
const search = (query: string) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return PAGES.filter((entry) =>
    words.every((word) => `${entry.title} ${entry.description}`.toLowerCase().includes(word)),
  );
};

/** A site header's search button, opening the search as a site wires it. */
function Site(props: Partial<SiteSearchProps>) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  const [results, setResults] = useState<SiteSearchResult[]>([]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Search
      </button>
      <SiteSearch
        title="Search Qeet Group"
        placeholder="Search businesses, technology, writing…"
        suggestions={["Qeet ID", "payments", "passwordless"]}
        results={results}
        onQueryChange={(query) => setResults(search(query))}
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    </>
  );
}

const dialog = () => page.getByRole("dialog", { name: "Search Qeet Group" });
const box = () => page.getByRole("combobox", { name: "Search Qeet Group" });
const option = (name: string | RegExp) => page.getByRole("option", { name });

describe("SiteSearch", () => {
  it("opens with ⌘K or Ctrl+K anywhere, titled, with the search box focused", async () => {
    await render(<Site />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.element(dialog()).toBeVisible();
    await expect.element(page.getByRole("heading", { name: "Search Qeet Group" })).toBeVisible();
    await expect.element(box()).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.element(dialog()).toBeVisible();
  });

  it("offers queries to try before anything is typed; one fills the box and searches", async () => {
    const onQueryChange = vi.fn((query: string) => search(query));
    await render(<Site defaultOpen onQueryChange={onQueryChange} />);
    const suggestions = page.getByRole("list", { name: "Try" });
    await expect.element(suggestions).toBeVisible();
    await page.getByRole("button", { name: "passwordless" }).click();
    await expect.element(box()).toHaveValue("passwordless");
    await expect.element(box()).toHaveFocus();
    expect(onQueryChange).toHaveBeenLastCalledWith("passwordless");
    await expect.element(suggestions).not.toBeInTheDocument();
  });

  it("shows the site's results as links, each with its kind, title, line and note", async () => {
    await render(<Site defaultOpen />);
    await userEvent.type(box(), "qeet id");
    const first = option(/^Product.*Qeet ID/);
    await expect.element(first).toBeVisible();
    await expect.element(first).toHaveAttribute("href", "#qeet-id");
    await expect.element(first).toHaveAttribute("data-highlighted");
    await expect
      .element(option(/Qeet ID is available/).getByText("Note added 28 Oct 2026"))
      .toBeVisible();
    expect(option(/Qeet Pay/).query()).toBeNull();
    await expect.element(page.getByRole("status")).toHaveTextContent("3 results");
    // The whole query is marked where it appears.
    const marks = [...(first.element() as HTMLElement).querySelectorAll("mark")];
    expect(marks.map((mark) => mark.textContent)).toEqual(["Qeet ID"]);
    await userEvent.clear(box());
    await userEvent.type(box(), "zzz");
    await expect.element(page.getByText("No results for “zzz”")).toBeVisible();
  });

  it("marks each word where the whole query doesn't appear", async () => {
    await render(<Site defaultOpen />);
    await userEvent.type(box(), "pay gst");
    const marks = (part: string) =>
      [
        ...(option(/Qeet Pay/).element() as HTMLElement).querySelectorAll(
          `[data-slot=${part}] mark`,
        ),
      ].map((mark) => mark.textContent);
    expect(marks("site-search-title")).toEqual(["Pay"]);
    expect(marks("site-search-description")).toEqual(["Pay", "GST"]);
  });

  it("clears the box with Clear search, keeping focus in it", async () => {
    await render(<Site defaultOpen />);
    await userEvent.type(box(), "pay");
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect.element(box()).toHaveValue("");
    await expect.element(box()).toHaveFocus();
    await expect.element(page.getByRole("list", { name: "Try" })).toBeVisible();
  });

  it("moves with the arrows and goes with Enter, closing and returning focus", async () => {
    const onNavigate = vi.fn();
    await render(<Site onNavigate={onNavigate} />);
    const trigger = page.getByRole("button", { name: "Search" });
    // From the keyboard: Safari doesn't focus a button on click, so only then is there focus to return.
    (trigger.element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.type(box(), "qeet id");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(option(/Qeet ID is available/)).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith("#qeet-id-available");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("follows the link itself without onNavigate, then closes", async () => {
    location.hash = "";
    await render(<Site defaultOpen />);
    await userEvent.type(box(), "pay");
    await option(/Qeet Pay/).click();
    expect(location.hash).toBe("#qeet-pay");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    location.hash = "";
  });

  it("links to every result when the site has more", async () => {
    const onNavigate = vi.fn();
    await render(
      <Site
        defaultOpen
        onNavigate={onNavigate}
        allResults={{ href: "/search?q=qeet", count: 32 }}
      />,
    );
    expect(page.getByRole("link", { name: /See all/ }).query()).toBeNull();
    await userEvent.type(box(), "qeet");
    await page.getByRole("link", { name: "See all 32 results" }).click();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/search?q=qeet");
  });

  it("says Searching… while the site's results are on their way", async () => {
    await render(<Site defaultOpen loading />);
    await userEvent.type(box(), "qeet");
    await expect.element(page.getByRole("status")).toHaveTextContent("Searching…");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <SiteSearch results={[]} onQueryChange={() => {}} suggestions={["Qeet ID"]} defaultOpen />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("dialog", { name: "खोजें" })).toBeVisible();
    await expect.element(page.getByRole("combobox")).toHaveAttribute("placeholder", "खोजें…");
    await expect.element(page.getByRole("list", { name: "आज़माएँ" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(1024, 720);
    await render(<Site defaultOpen hotkey={false} allResults={{ href: "/search", count: 12 }} />);
    await expectAccessible(document.querySelector(".qx-site-search") as HTMLElement);
    await userEvent.type(box(), "qeet id");
    await expect.element(option(/^Product.*Qeet ID/)).toBeVisible();
    await expectAccessible(document.querySelector(".qx-site-search") as HTMLElement);
    await screenshotEveryMode("SiteSearch", null);
  });
});
