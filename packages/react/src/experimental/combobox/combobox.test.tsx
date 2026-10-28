import { SearchIcon } from "@qeetrix/icons/icons/search";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Combobox } from "./combobox";

const PEOPLE = [
  { value: "usr_1", label: "Priya Sharma", description: "priya@acme.in" },
  { value: "usr_2", label: "Rahul Verma", description: "rahul.verma@acme.in" },
  { value: "usr_3", label: "Ananya Iyer", description: "ananya@acme.in" },
  { value: "usr_4", label: "Karthik Reddy", description: "karthik.r@acme.in", disabled: true },
];

const ROLES = [
  {
    label: "Directory",
    items: [
      { value: "users.read", label: "Read users" },
      { value: "users.write", label: "Manage users" },
    ],
  },
  {
    label: "Security",
    items: [
      { value: "audit.read", label: "Read audit logs" },
      { value: "sessions.revoke", label: "Revoke sessions" },
    ],
  },
];

const field = () => page.getByRole("combobox", { name: "Owner" });

type Person = (typeof PEOPLE)[number];
/** A directory searched on a "server": by name or email, answering after `latency` ms. */
function Directory({
  onSearch,
  multiple = false,
  latency = 150,
  initial = PEOPLE.slice(0, 2),
}: {
  onSearch: (query: string) => void;
  multiple?: boolean;
  latency?: number;
  initial?: Person[];
}) {
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  return (
    <Field label="Owner">
      <Combobox
        items={items}
        loading={loading}
        multiple={multiple}
        onSearch={(query) => {
          onSearch(query);
          setLoading(true);
          setTimeout(() => {
            const text = query.toLowerCase();
            setItems(
              PEOPLE.filter(
                (person) =>
                  person.label.toLowerCase().includes(text) || person.description.includes(text),
              ),
            );
            setLoading(false);
          }, latency);
        }}
      />
    </Field>
  );
}

describe("Combobox", () => {
  it("is a combobox named by its field, narrowing its options as you type", async () => {
    await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} placeholder="e.g. Priya Sharma" />
      </Field>,
    );
    await field().click();
    await expect.element(page.getByRole("option", { name: /Rahul Verma/ })).toBeVisible();
    await userEvent.type(field(), "an");
    await expect.element(page.getByRole("option", { name: /Ananya Iyer/ })).toBeVisible();
    expect(page.getByRole("option", { name: /Rahul Verma/ }).elements()).toHaveLength(0);
  });

  it("stores the option's ID, shows its label, and clears", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} onValueChange={onValueChange} />
      </Field>,
    );
    await userEvent.type(field(), "rahul");
    await page.getByRole("option", { name: /Rahul Verma/ }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("usr_2");
    await expect.element(field()).toHaveValue("Rahul Verma");
    await page.getByRole("button", { name: "Clear Owner" }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBeNull();
  });

  it("says when nothing matches", async () => {
    await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} />
      </Field>,
    );
    await userEvent.type(field(), "zzz");
    await expect.element(page.getByText("No matches")).toBeVisible();
  });

  it("shows groups under their labels, and keeps disabled options out of reach", async () => {
    await render(
      <Field label="Owner">
        <Combobox items={ROLES} />
      </Field>,
    );
    await field().click();
    await expect.element(page.getByText("Security", { exact: true })).toBeVisible();
    await expect.element(page.getByRole("option", { name: "Revoke sessions" })).toBeVisible();
  });

  it("picks several as removable pills: by button, or Backspace for the last", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Owner">
        <Combobox
          items={PEOPLE}
          multiple
          defaultValue={["usr_1", "usr_2"]}
          onValueChange={onValueChange}
        />
      </Field>,
    );
    const chips = () =>
      [...document.querySelectorAll("[data-slot=combobox-chip]")].map((chip) =>
        chip.getAttribute("aria-label"),
      );
    expect(chips()).toEqual(["Priya Sharma", "Rahul Verma"]);
    expect(field().element().getAttribute("aria-description")).toMatch(/^2 selected/);
    await page.getByRole("button", { name: "Remove Priya Sharma" }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual(["usr_2"]);
    await field().click();
    await userEvent.keyboard("{Backspace}");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual([]);
  });

  it('names its Clear button after its field, without the field\'s "(optional)"', async () => {
    await render(
      <>
        <Field label="Owner">
          <Combobox items={PEOPLE} defaultValue="usr_1" />
        </Field>
        <Field label="Reviewer" optional>
          <Combobox items={PEOPLE} defaultValue="usr_2" />
        </Field>
        <Combobox items={PEOPLE} aria-label="Approver" defaultValue="usr_3" />
      </>,
    );
    const names = [...document.querySelectorAll("[data-slot=combobox-clear]")].map((clear) =>
      clear.getAttribute("aria-label"),
    );
    expect(names).toEqual(["Clear Owner", "Clear Reviewer", "Clear Approver"]);
    expect(document.querySelectorAll("[data-slot=combobox-trigger]")).toHaveLength(3);
  });

  it("searches the server once typing pauses, shows the wait, and lists the results as given", async () => {
    const onSearch = vi.fn();
    await render(<Directory onSearch={onSearch} />);
    await field().click();
    await userEvent.type(field(), "verma@");
    // One search per pause, not per key.
    await expect.poll(() => onSearch.mock.calls).toEqual([["verma@"]]);
    await expect.element(page.getByText("Searching…")).toBeVisible();
    await expect.element(page.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(page.getByText("No matches").query()).toBeNull();
    // Matched by email on the server; the label doesn't contain "verma@", and the list doesn't
    // filter again.
    await expect.element(page.getByText("Searching…")).not.toBeInTheDocument();
    await expect.element(page.getByRole("listbox")).not.toHaveAttribute("aria-busy");
    await expect.element(page.getByRole("option", { name: /Rahul Verma/ })).toBeVisible();
    expect(page.getByRole("option").elements()).toHaveLength(1);
  });

  it("says No matches once the server finds nothing", async () => {
    await render(<Directory onSearch={() => {}} latency={20} />);
    await userEvent.type(field(), "zzz");
    await expect.element(page.getByText("No matches")).toBeVisible();
    expect(page.getByRole("option").elements()).toHaveLength(0);
  });

  it('keeps a chosen option\'s label when new results leave it out, and searches "" when cleared', async () => {
    const onSearch = vi.fn();
    await render(<Directory onSearch={onSearch} latency={20} />);
    await userEvent.type(field(), "ananya");
    await page.getByRole("option", { name: /Ananya Iyer/ }).click();
    await expect.element(field()).toHaveValue("Ananya Iyer");
    // Choosing filled the field in: that isn't a search.
    expect(onSearch.mock.calls).toEqual([["ananya"]]);
    // Typed over, then left: the field goes back to the chosen option, whose label the new
    // results no longer carry.
    await userEvent.fill(field(), "priya");
    await expect.poll(() => onSearch.mock.calls.at(-1)).toEqual(["priya"]);
    await expect.element(page.getByRole("option", { name: /Priya Sharma/ })).toBeVisible();
    expect(page.getByRole("option").elements()).toHaveLength(1);
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
    await expect.element(field()).toHaveValue("Ananya Iyer");

    onSearch.mockClear();
    await page.getByRole("button", { name: "Clear Owner" }).click();
    // At once, without waiting for a pause.
    expect(onSearch.mock.calls).toEqual([[""]]);
  });

  it("keeps chosen pills' labels when new results leave them out", async () => {
    await render(<Directory onSearch={() => {}} multiple latency={20} />);
    await userEvent.type(field(), "priya");
    await page.getByRole("option", { name: /Priya Sharma/ }).click();
    await userEvent.type(field(), "rahul");
    await expect.element(page.getByRole("option", { name: /Rahul Verma/ })).toBeVisible();
    await expect.poll(() => page.getByRole("option").elements().length).toBe(1);
    const chips = [...document.querySelectorAll("[data-slot=combobox-chip]")].map((chip) =>
      chip.getAttribute("aria-label"),
    );
    expect(chips).toEqual(["Priya Sharma"]);
  });

  it("shows items as given with filter={null}, and filters as before without it", async () => {
    const { rerender } = await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} filter={null} />
      </Field>,
    );
    await userEvent.type(field(), "zzz");
    await expect.element(page.getByRole("option", { name: /Priya Sharma/ })).toBeVisible();
    expect(page.getByRole("option").elements()).toHaveLength(4);
    await rerender(
      <Field label="Owner">
        <Combobox key="client" items={PEOPLE} />
      </Field>,
    );
    await userEvent.type(field(), "zzz");
    await expect.element(page.getByText("No matches")).toBeVisible();
  });

  it("can be disabled", async () => {
    await render(
      <Field label="Owner" disabled>
        <Combobox items={PEOPLE} disabled />
      </Field>,
    );
    await expect.element(field()).toBeDisabled();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Combobox items={PEOPLE} aria-label="Owner" defaultValue="usr_1" />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "Owner साफ़ करें" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "विकल्प दिखाएँ" })).toBeVisible();
  });

  it("speaks Hindi while searching", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Combobox items={PEOPLE} aria-label="Owner" loading defaultOpen />
      </QeetrixProvider>,
    );
    await expect.element(page.getByText(hi.combobox.loading)).toBeVisible();
    expect(hi.combobox.loading).toMatch(/^खोज रहे हैं…$/);
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(760, 420);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 720,
          blockSize: 380,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Field label="Owner">
          <Combobox items={PEOPLE} icon={SearchIcon} placeholder="e.g. Priya Sharma" defaultOpen />
        </Field>
        <Field label="Members">
          <Combobox items={PEOPLE} multiple defaultValue={["usr_1", "usr_3"]} />
        </Field>
      </div>,
    );
    await expect.element(page.getByRole("option", { name: /Priya Sharma/ })).toBeVisible();
    await screenshotEveryMode("Combobox", null);
    // While a list is open Base UI hides the rest of the page from assistive technology, so the
    // open list is checked on its own, then the form once the list has closed.
    await expectAccessible(document.querySelector("[data-slot=combobox-popup]") as HTMLElement);
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
    await expectAccessible(container);
  });

  it("is accessible while searching, and looks right in every mode", async () => {
    await page.viewport(760, 420);
    await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 720,
          blockSize: 380,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Field label="Owner">
          <Combobox
            items={PEOPLE.slice(0, 2)}
            icon={SearchIcon}
            loading
            filter={null}
            defaultOpen
          />
        </Field>
      </div>,
    );
    await expect.element(page.getByText("Searching…")).toBeVisible();
    await screenshotEveryMode("Combobox · searching", null);
    await expectAccessible(document.querySelector("[data-slot=combobox-popup]") as HTMLElement);
  });
});

describe("Combobox with allowCustom", () => {
  const PATHS = [
    { value: "subject.role", label: "subject.role" },
    { value: "resource.owner", label: "resource.owner" },
  ];

  it("offers typed text that matches no option, and chooses it as the value", async () => {
    const onValueChange = vi.fn();
    await render(
      <Combobox<string>
        aria-label="Attribute"
        items={PATHS}
        allowCustom
        onValueChange={onValueChange}
      />,
    );
    const input = page.getByRole("combobox", { name: "Attribute" });
    await input.click();
    await userEvent.keyboard("subject.department");
    const custom = page.getByRole("option", { name: "Use “subject.department”" });
    await expect.element(custom).toBeVisible();
    await custom.click();
    expect(onValueChange).toHaveBeenLastCalledWith("subject.department", expect.anything());
    await expect.element(input).toHaveValue("subject.department");
  });

  it("offers nothing extra when the text is an option's label", async () => {
    await render(<Combobox<string> aria-label="Attribute" items={PATHS} allowCustom />);
    await page.getByRole("combobox", { name: "Attribute" }).click();
    await userEvent.keyboard("subject.role");
    await expect.element(page.getByRole("option", { name: "subject.role" })).toBeVisible();
    expect(page.getByRole("option", { name: /^Use / }).elements()).toHaveLength(0);
  });
});
