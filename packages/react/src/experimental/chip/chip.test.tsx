import { MailIcon } from "@qeetrix/icons/icons/mail";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { srgb, tokenColor } from "../../../tests/support/color";
import { tab } from "../../../tests/support/keyboard";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { settled } from "../../../tests/support/settled";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Chip, ChipGroup } from "./chip";

const html = document.documentElement;
afterEach(() => {
  delete html.dataset.qxDensity;
  delete html.dataset.qxColorScheme;
  html.removeAttribute("dir");
});

const STATUSES = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

/** A ChipGroup of several values, its value shown beside it. */
function Departments() {
  const [value, setValue] = useState<string[]>(["eng"]);
  return (
    <>
      <ChipGroup label="Departments" multiple value={value} onValueChange={setValue}>
        <Chip value="eng">Engineering</Chip>
        <Chip value="fin">Finance</Chip>
        <Chip value="ops">Operations</Chip>
      </ChipGroup>
      <output>{value.join(",")}</output>
    </>
  );
}

describe("Chip", () => {
  it("is a checkbox named by its label, turned on and off by a click or Space", async () => {
    const onCheckedChange = vi.fn();
    await render(<Chip onCheckedChange={onCheckedChange}>Unread</Chip>);
    const chip = page.getByRole("checkbox", { name: "Unread" });
    await chip.click();
    await expect.element(chip).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard(" ");
    await expect.element(chip).not.toBeChecked();
  });

  it("chosen: the selected tint, a 2px Ember edge and a check before the label", async () => {
    const { container } = await render(
      <>
        <Chip defaultChecked>Unread</Chip>
        <Chip>Starred</Chip>
        <Chip defaultChecked icon={MailIcon}>
          Mentions
        </Chip>
      </>,
    );
    const [chosen, rest, withIcon] = [
      ...container.querySelectorAll<HTMLElement>("[data-slot=chip]"),
    ] as [HTMLElement, HTMLElement, HTMLElement];
    const chosenStyle = getComputedStyle(chosen);
    expect(chosenStyle.backgroundColor).toBe(tokenColor("--qx-color-bg-selected"));
    expect(chosenStyle.boxShadow).toBe(
      `${tokenColor("--qx-color-border-brand")} 0px 0px 0px 2px inset`,
    );
    expect(getComputedStyle(rest).boxShadow).toBe(
      `${tokenColor("--qx-color-border-subtle")} 0px 0px 0px 1px inset`,
    );
    expect(getComputedStyle(rest).backgroundColor).toBe(tokenColor("--qx-color-bg-neutral-subtle"));
    // The check is the first part, so the choice never rests on colour; an icon takes its place.
    expect(chosen.firstElementChild?.getAttribute("data-slot")).toBe("chip-check");
    expect(rest.querySelector("[data-slot=chip-check]")).toBeNull();
    expect(withIcon.querySelector("[data-slot=chip-check]")).toBeNull();
    expect(withIcon.firstElementChild?.getAttribute("data-slot")).toBe("chip-icon");
    // 4px corners, as controls have: only people and status are round.
    expect(chosenStyle.borderRadius).toBe("4px");
  });

  it("follows the density: sm, md and lg are the controls' heights", async () => {
    const { container } = await render(
      <>
        <Chip size="sm">Small</Chip>
        <Chip>Medium</Chip>
        <Chip size="lg">Large</Chip>
      </>,
    );
    const chips = [...container.querySelectorAll<HTMLElement>("[data-slot=chip]")];
    const heights: Record<string, number[]> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = chips.map((chip) => chip.getBoundingClientRect().height);
    }
    expect(heights).toEqual({
      compact: [24, 28, 32],
      default: [28, 32, 40],
      comfortable: [32, 36, 44],
    });
  });

  it("tints under the pointer, and shows the Ember frame 2px outside on keyboard focus", async () => {
    await render(<Chip>Unread</Chip>);
    const chip = page.getByRole("checkbox", { name: "Unread" }).element() as HTMLElement;
    await userEvent.hover(chip);
    await settled();
    expect(getComputedStyle(chip).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle-hover"),
    );
    await tab();
    await expect.element(page.getByRole("checkbox", { name: "Unread" })).toHaveFocus();
    const style = getComputedStyle(chip);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(tokenColor("--qx-color-border-focus"));
  });

  it("is greyed and can't be turned on when disabled", async () => {
    const onCheckedChange = vi.fn();
    await render(
      <Chip disabled onCheckedChange={onCheckedChange}>
        Archived
      </Chip>,
    );
    const chip = page.getByRole("checkbox", { name: "Archived" });
    await expect.element(chip).toHaveAttribute("aria-disabled", "true");
    await chip.click({ force: true });
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(getComputedStyle(chip.element()).color).toBe(tokenColor("--qx-color-text-disabled"));
  });

  it("wraps a long label rather than cut it", async () => {
    const label = "Kaveri Foods Private Limited, Chennai regional office";
    await render(
      <div style={{ inlineSize: 160 }}>
        <Chip>{label}</Chip>
      </div>,
    );
    const chip = page.getByRole("checkbox", { name: label }).element() as HTMLElement;
    const text = chip.querySelector("[data-slot=chip-label]") as HTMLElement;
    expect(chip.getBoundingClientRect().width).toBeLessThanOrEqual(160);
    expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
    expect(chip.getBoundingClientRect().height).toBeGreaterThan(32);
  });
});

describe("removable Chip", () => {
  it("is a label with a remove button named after it", async () => {
    const onRemove = vi.fn();
    await render(<Chip onRemove={onRemove}>Status: Active</Chip>);
    expect(page.getByRole("checkbox").elements()).toHaveLength(0);
    const remove = page.getByRole("button", { name: "Remove Status: Active" });
    await remove.click();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("takes a remove name for a label that isn't text, and speaks Hindi", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Chip onRemove={() => {}}>स्थिति: सक्रिय</Chip>
        <Chip onRemove={() => {}} removeLabel="Remove Priya">
          <strong>Priya</strong>
        </Chip>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "स्थिति: सक्रिय हटाएँ" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Remove Priya" })).toBeVisible();
  });

  it("ends in its remove button, inside the chip, at every size", async () => {
    const { container } = await render(
      <>
        <Chip size="sm" onRemove={() => {}}>
          Status: Active
        </Chip>
        <Chip onRemove={() => {}}>Team: Finance</Chip>
      </>,
    );
    for (const chip of container.querySelectorAll<HTMLElement>("[data-slot=chip]")) {
      const remove = chip.querySelector(".qx-chip-remove") as HTMLElement;
      const [box, button] = [chip.getBoundingClientRect(), remove.getBoundingClientRect()];
      expect(button.right).toBe(box.right);
      expect(button.top).toBeGreaterThanOrEqual(box.top);
      expect(button.bottom).toBeLessThanOrEqual(box.bottom);
    }
  });

  it("disables its remove button with it", async () => {
    const onRemove = vi.fn();
    await render(
      <Chip disabled onRemove={onRemove}>
        Status: Active
      </Chip>,
    );
    const remove = page.getByRole("button", { name: "Remove Status: Active" });
    await expect.element(remove).toHaveAttribute("aria-disabled", "true");
    await remove.click({ force: true });
    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe("ChipGroup", () => {
  it("one value: a named radio group, one tab stop, arrow keys moving the choice", async () => {
    const onValueChange = vi.fn();
    await render(
      <ChipGroup label="Status" defaultValue="all" onValueChange={onValueChange}>
        {STATUSES.map((status) => (
          <Chip key={status.value} value={status.value}>
            {status.label}
          </Chip>
        ))}
      </ChipGroup>,
    );
    await expect.element(page.getByRole("radiogroup", { name: "Status" })).toBeVisible();
    await expect.element(page.getByRole("radio", { name: "All" })).toBeChecked();
    await tab();
    await expect.element(page.getByRole("radio", { name: "All" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("radio", { name: "Open" })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("open", expect.anything());
    // The chosen one is drawn chosen.
    await settled();
    expect(
      srgb(getComputedStyle(page.getByRole("radio", { name: "Open" }).element()).backgroundColor),
    ).toEqual(srgb(tokenColor("--qx-color-bg-selected")));
  });

  it("one value: the left arrow moves on in right to left", async () => {
    html.dir = "rtl";
    await render(
      <QeetrixProvider direction="rtl">
        <ChipGroup label="Status" defaultValue="all">
          {STATUSES.map((status) => (
            <Chip key={status.value} value={status.value}>
              {status.label}
            </Chip>
          ))}
        </ChipGroup>
      </QeetrixProvider>,
    );
    await tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(page.getByRole("radio", { name: "Open" })).toBeChecked();
  });

  it("several values: a named group of checkboxes, its value the chosen ones", async () => {
    await render(<Departments />);
    await expect.element(page.getByRole("group", { name: "Departments" })).toBeVisible();
    await page.getByRole("checkbox", { name: "Finance" }).click();
    await expect.element(page.getByText("eng,fin")).toBeVisible();
    await page.getByRole("checkbox", { name: "Engineering" }).click();
    await expect.element(page.getByText(/^fin$/)).toBeVisible();
  });

  it("sizes every chip, and wraps them onto more lines with a small gap", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 180 }}>
        <ChipGroup label="Status" size="sm" defaultValue="all">
          {STATUSES.map((status) => (
            <Chip key={status.value} value={status.value}>
              {status.label}
            </Chip>
          ))}
          <Chip value="archived">Archived</Chip>
        </ChipGroup>
      </div>,
    );
    const chips = [...container.querySelectorAll<HTMLElement>("[data-slot=chip]")];
    expect(new Set(chips.map((chip) => chip.dataset.size))).toEqual(new Set(["sm"]));
    const tops = new Set(chips.map((chip) => Math.round(chip.getBoundingClientRect().top)));
    expect(tops.size).toBeGreaterThan(1);
    const group = container.querySelector("[data-slot=chip-group]") as HTMLElement;
    expect(getComputedStyle(group).columnGap).toBe("8px");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 12 }}>
          <ChipGroup label="Status" defaultValue="open">
            {STATUSES.map((status) => (
              <Chip key={status.value} value={status.value}>
                {status.label}
              </Chip>
            ))}
            <Chip value="draft" disabled>
              Draft
            </Chip>
          </ChipGroup>
          <ChipGroup label="Labels" multiple defaultValue={["urgent"]} size="sm">
            <Chip value="urgent">Urgent</Chip>
            <Chip value="billing" icon={MailIcon}>
              Billing
            </Chip>
          </ChipGroup>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip onRemove={() => {}}>Status: Active</Chip>
            <Chip size="lg" onRemove={() => {}}>
              Team: Finance
            </Chip>
            <Chip disabled onRemove={() => {}}>
              Owner: Priya
            </Chip>
          </div>
        </div>
      </Stage>,
    );
    for (const scheme of ["light", "dark"]) {
      html.dataset.qxColorScheme = scheme;
      await expectAccessible(container);
    }
    delete html.dataset.qxColorScheme;
    await screenshotEveryMode("Chip");
  });
});
