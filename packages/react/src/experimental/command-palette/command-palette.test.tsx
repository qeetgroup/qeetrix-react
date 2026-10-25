import { AppWindowIcon } from "@qeetrix/icons/icons/app-window";
import { SettingsIcon } from "@qeetrix/icons/icons/settings";
import { UserPlusIcon } from "@qeetrix/icons/icons/user-plus";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { type CommandGroup, CommandPalette, type CommandPaletteProps } from "./command-palette";

const GROUPS: CommandGroup[] = [
  {
    label: "Users",
    items: [
      {
        value: "usr_1",
        label: "Priya Sharma",
        description: "priya@acme.in · Engineering",
        avatar: { name: "Priya Sharma" },
      },
      {
        value: "usr_2",
        label: "Priyanka Rao",
        description: "priyanka@acme.in · Finance",
        avatar: { name: "Priyanka Rao" },
      },
      {
        value: "usr_3",
        label: "Rahul Verma",
        description: "rahul@acme.in",
        avatar: { name: "Rahul Verma" },
      },
    ],
  },
  {
    label: "Applications",
    items: [
      { value: "app_1", label: "Priority support portal", meta: "OIDC", icon: AppWindowIcon },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        value: "set_1",
        label: "Two-step sign-in",
        meta: "Security › Policies",
        icon: SettingsIcon,
        keywords: ["MFA"],
      },
    ],
  },
  {
    label: "Actions",
    items: [{ value: "act_1", label: "Invite users", icon: UserPlusIcon, shortcut: ["I"] }],
  },
];

/** A page with the top bar's search, opening the palette, as a console wires it. */
function Console(props: Partial<CommandPaletteProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Search or jump to
      </button>
      <CommandPalette
        groups={GROUPS}
        onSelect={() => {}}
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    </>
  );
}

const dialog = () => page.getByRole("dialog", { name: "Search or jump to" });
const box = () => page.getByRole("combobox", { name: "Search or jump to" });
const option = (name: string | RegExp) => page.getByRole("option", { name });

describe("CommandPalette", () => {
  it("opens with ⌘K or Ctrl+K anywhere, with the search box focused", async () => {
    await render(<Console />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await expect.element(dialog()).toBeVisible();
    await expect.element(box()).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.element(dialog()).toBeVisible();
  });

  it("shows grouped results, filtered by label, description and keywords", async () => {
    await render(<Console defaultOpen />);
    await page.getByRole("button", { name: "Search or jump to" }).click();
    await expect.element(page.getByText("Applications", { exact: true })).toBeVisible();
    await userEvent.type(box(), "pri");
    await expect.element(option(/Priya Sharma/)).toBeVisible();
    await expect.element(option(/Priority support portal/)).toBeVisible();
    expect(option(/Rahul Verma/).query()).toBeNull();
    expect(page.getByText("Settings", { exact: true }).query()).toBeNull();
    await userEvent.clear(box());
    await userEvent.type(box(), "mfa");
    await expect.element(option(/Two-step sign-in/)).toBeVisible();
    await userEvent.clear(box());
    await userEvent.type(box(), "zzz");
    await expect.element(page.getByText("No results for “zzz”")).toBeVisible();
  });

  it("moves with the arrows, opens with Enter, closes, and returns focus", async () => {
    const onSelect = vi.fn();
    await render(<Console onSelect={onSelect} />);
    const trigger = page.getByRole("button", { name: "Search or jump to" });
    // From the keyboard: Safari doesn't focus a button on click, so only then is there focus to return.
    (trigger.element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.type(box(), "pri");
    await expect.element(option(/Priya Sharma/)).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(option(/Priyanka Rao/)).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].value).toBe("usr_2");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("opens a result on click", async () => {
    const onSelect = vi.fn();
    await render(<Console onSelect={onSelect} />);
    await page.getByRole("button", { name: "Search or jump to" }).click();
    await option(/Invite users/).click();
    expect(onSelect.mock.calls[0]?.[0].value).toBe("act_1");
  });

  it("lets the app search: the query goes out, results show as given", async () => {
    const onQueryChange = vi.fn();
    await render(
      <Console
        onQueryChange={onQueryChange}
        loading
        groups={[{ label: "Users", items: [{ value: "usr_9", label: "Server result" }] }]}
      />,
    );
    await page.getByRole("button", { name: "Search or jump to" }).click();
    await userEvent.type(box(), "acme");
    expect(onQueryChange).toHaveBeenLastCalledWith("acme");
    await expect.element(option(/Server result/)).toBeVisible();
    await expect.element(page.getByRole("status")).toHaveTextContent("Searching…");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <CommandPalette groups={GROUPS} onSelect={() => {}} defaultOpen />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("dialog", { name: "खोजें या सीधे जाएँ" })).toBeVisible();
    await expect
      .element(page.getByRole("combobox"))
      .toHaveAttribute("placeholder", "खोजें या सीधे जाएँ…");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(960, 640);
    await render(<CommandPalette groups={GROUPS} onSelect={() => {}} defaultOpen hotkey={false} />);
    await userEvent.type(box(), "pri");
    await expect.element(option(/Priya Sharma/)).toBeVisible();
    await expectAccessible(document.querySelector("[data-slot=command-palette]") as HTMLElement);
    await screenshotEveryMode("CommandPalette", null);
  });
});
