import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { SearchField } from "../search-field/search-field";
import { type AppliedFilter, FilterTags } from "./filter-tags";

const FILTERS: AppliedFilter[] = [
  { id: "status", label: "Status", value: "Active" },
  { id: "mfa", label: "MFA", value: "Passkey" },
  { id: "department", label: "Department", value: "Engineering, Finance" },
];

/** A list's filters, as a Users screen holds them. */
function Users() {
  const [filters, setFilters] = useState(FILTERS);
  const search = useRef<HTMLInputElement>(null);
  return (
    <>
      <SearchField ref={search} aria-label="Search users" />
      <FilterTags
        filters={filters}
        onRemove={(id) => setFilters((all) => all.filter((filter) => filter.id !== id))}
        onClear={() => setFilters([])}
        summary={`${412 + (3 - filters.length) * 100} of 1,284 users`}
        returnFocusTo={search}
      />
    </>
  );
}

const remove = (name: string) => page.getByRole("button", { name: `Remove filter ${name}` });

describe("FilterTags", () => {
  it("lists the applied filters, each with a remove button named for it", async () => {
    await render(<Users />);
    const list = page.getByRole("list", { name: "Applied filters" });
    await expect.element(list).toBeVisible();
    expect(page.getByRole("listitem").all()).toHaveLength(3);
    await expect.element(page.getByRole("listitem").first()).toHaveTextContent("Status:Active");
    await expect.element(remove("Department: Engineering, Finance")).toBeVisible();
  });

  it("removes a filter, moves focus to the next tag, and announces the new count", async () => {
    const onRemove = vi.fn();
    const { rerender } = await render(
      <FilterTags filters={FILTERS} onRemove={onRemove} summary="412 of 1,284 users" />,
    );
    await remove("MFA: Passkey").click();
    expect(onRemove).toHaveBeenCalledWith("mfa");
    await rerender(
      <FilterTags
        filters={FILTERS.filter((f) => f.id !== "mfa")}
        onRemove={onRemove}
        summary="512 of 1,284 users"
      />,
    );
    await expect.element(remove("Department: Engineering, Finance")).toHaveFocus();
    const summary = page.getByText("512 of 1,284 users");
    await expect.element(summary).toHaveAttribute("aria-live", "polite");
  });

  it("clears them all, and gives focus back to the search field", async () => {
    await render(<Users />);
    await page.getByRole("button", { name: "Clear all" }).click();
    expect(page.getByRole("list").query()).toBeNull();
    await expect.element(page.getByRole("searchbox", { name: "Search users" })).toHaveFocus();
    await expect.element(page.getByText("712 of 1,284 users")).toBeVisible();
  });

  it("returns focus to the search field when the last filter is removed", async () => {
    await render(<Users />);
    await remove("Status: Active").click();
    await expect.element(remove("MFA: Passkey")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(remove("Department: Engineering, Finance")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("searchbox", { name: "Search users" })).toHaveFocus();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <FilterTags filters={FILTERS} onRemove={() => {}} onClear={() => {}} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("list", { name: "लागू फ़िल्टर" })).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "फ़िल्टर Status: Active हटाएँ" }))
      .toBeVisible();
    await expect.element(page.getByRole("button", { name: "सब हटाएँ" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(820, 240);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{ padding: 16, inlineSize: 780, background: "var(--qx-color-surface-canvas)" }}
      >
        <FilterTags
          filters={FILTERS}
          onRemove={() => {}}
          onClear={() => {}}
          summary="412 of 1,284 users"
        />
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("FilterTags", "[data-qx-stage]");
  });
});
