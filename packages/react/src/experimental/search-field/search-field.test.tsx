import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { SearchField } from "./search-field";

const box = () => page.getByRole("searchbox", { name: "Search users" });
const clear = () => page.getByRole("button", { name: "Clear search" });

describe("SearchField", () => {
  it("is a searchbox named by its label, with Clear only while there's text", async () => {
    await render(<SearchField aria-label="Search users" />);
    await expect.element(box()).toBeVisible();
    expect(clear().query()).toBeNull();
    await userEvent.type(box(), "priya");
    await expect.element(clear()).toBeVisible();
  });

  it("searches once typing pauses, not on every key", async () => {
    const onSearch = vi.fn();
    await render(<SearchField aria-label="Search users" searchDelay={50} onSearch={onSearch} />);
    await userEvent.fill(box(), "pri");
    expect(onSearch).not.toHaveBeenCalled();
    await expect.poll(() => onSearch.mock.calls).toEqual([["pri"]]);
  });

  it("searches at once on Enter, without searching the same text again, and '' when cleared", async () => {
    const onSearch = vi.fn();
    // A pause long enough never to come during the test: only Enter and Clear search.
    await render(
      <SearchField aria-label="Search users" searchDelay={60_000} onSearch={onSearch} />,
    );
    await userEvent.type(box(), "priya{Enter}");
    expect(onSearch.mock.calls).toEqual([["priya"]]);
    await clear().click();
    expect(onSearch.mock.calls).toEqual([["priya"], [""]]);
    await expect.element(box()).toHaveValue("");
    await expect.element(box()).toHaveFocus();
  });

  it("clears on Escape, and lets Escape through once empty", async () => {
    const outer = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: stands in for a dialog, listening for the Escape the field lets through
      <div onKeyDown={(event) => event.key === "Escape" && outer()}>
        <SearchField aria-label="Search users" defaultValue="priya" />
      </div>,
    );
    await box().click();
    await userEvent.keyboard("{Escape}");
    await expect.element(box()).toHaveValue("");
    expect(outer).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it("follows a controlled value", async () => {
    const onValueChange = vi.fn();
    await render(
      <SearchField aria-label="Search users" value="rahul" onValueChange={onValueChange} />,
    );
    await expect.element(box()).toHaveValue("rahul");
    await clear().click();
    expect(onValueChange).toHaveBeenLastCalledWith("");
    await expect.element(box()).toHaveValue("rahul");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <SearchField aria-label="Search users" defaultValue="priya" />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "खोज साफ़ करें" })).toBeVisible();
  });

  it("is accessible and looks right in both colour schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 16, inlineSize: 320 }}>
          <SearchField aria-label="Search users" placeholder="Search by name, email or ID" />
          <Field label="Search users">
            <SearchField defaultValue="priya" />
          </Field>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("SearchField", "[data-qx-stage]");
  });
});
