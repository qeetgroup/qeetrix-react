import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Card } from "../../card/card";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Table } from "../../table/table";
import { AvatarGroup } from "./avatar-group";

const PEOPLE = [
  "Priya Sharma",
  "Rahul Verma",
  "Ananya Iyer",
  "Karthik Reddy",
  "Meera Nair",
  "Arjun Mehta",
  "Sneha Kulkarni",
].map((name) => ({ name }));

/** The list as this browser's Intl writes it: engines differ on the serial comma ("A, B, and C"). */
const list = (items: string[]) =>
  new Intl.ListFormat("en-IN", { type: "conjunction" }).format(items);

describe("AvatarGroup", () => {
  it("is one image named in full, the rest counted", async () => {
    await render(<AvatarGroup people={PEOPLE} total={412} />);
    await expect
      .element(page.getByRole("img"))
      .toHaveAccessibleName(
        `412 people: ${list(["Priya Sharma", "Rahul Verma", "Ananya Iyer", "409 more"])}`,
      );
    expect(document.querySelectorAll("[data-slot=avatar]")).toHaveLength(3);
    expect(document.querySelector(".qx-avatar-group-more")?.textContent).toBe("+409");
  });

  it("names everyone when they all show, and shows a face rather than +1", async () => {
    const { rerender } = await render(<AvatarGroup people={PEOPLE.slice(1, 3)} />);
    await expect
      .element(page.getByRole("img"))
      .toHaveAccessibleName("2 people: Rahul Verma and Ananya Iyer");
    expect(document.querySelector(".qx-avatar-group-more")).toBeNull();
    await rerender(<AvatarGroup people={PEOPLE.slice(0, 4)} />);
    expect(document.querySelectorAll("[data-slot=avatar]")).toHaveLength(4);
    expect(document.querySelector(".qx-avatar-group-more")).toBeNull();
  });

  it("keeps every avatar whole: side by side, not overlapped", async () => {
    await render(<AvatarGroup people={PEOPLE} total={12} size="md" />);
    const [first, second] = [...document.querySelectorAll<HTMLElement>("[data-slot=avatar]")].map(
      (avatar) => avatar.getBoundingClientRect(),
    );
    expect(second?.left ?? 0).toBeGreaterThanOrEqual(first?.right ?? 0);
    const more = (
      document.querySelector(".qx-avatar-group-more") as HTMLElement
    ).getBoundingClientRect();
    expect(more.height).toBe(32);
  });

  it("keeps two people with the same name apart: unique keys, both shown", async () => {
    // Regression: avatars were keyed by name, so a repeated name gave React a duplicate key.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const twins = [{ name: "Priya Sharma" }, { name: "Priya Sharma" }, { name: "Rahul Verma" }];
      const { rerender } = await render(<AvatarGroup people={twins} />);
      expect(document.querySelectorAll("[data-slot=avatar]")).toHaveLength(3);
      await rerender(<AvatarGroup people={twins.slice(1)} />);
      expect(document.querySelectorAll("[data-slot=avatar]")).toHaveLength(2);
      await expect
        .element(page.getByRole("img"))
        .toHaveAccessibleName("2 people: Priya Sharma and Rahul Verma");
      const messages = error.mock.calls.map((call) => call.map(String).join(" "));
      expect(messages.filter((message) => /same key/i.test(message))).toEqual([]);
    } finally {
      error.mockRestore();
    }
  });

  it("passes a square shape to every avatar, and squares the count to match", async () => {
    const apps = ["Qeet Pay", "Qeet People", "Qeet Logs", "Qeet Notify", "Qeet ID"].map((name) => ({
      name,
    }));
    await render(<AvatarGroup people={apps} shape="square" size="md" />);
    const avatars = [...document.querySelectorAll<HTMLElement>("[data-slot=avatar]")];
    expect(avatars).toHaveLength(3);
    for (const avatar of avatars) {
      expect(avatar.dataset.shape).toBe("square");
      expect(getComputedStyle(avatar).borderRadius).toBe("4px");
    }
    const more = document.querySelector(".qx-avatar-group-more") as HTMLElement;
    expect(getComputedStyle(more).borderRadius).toBe("4px");
    expect(more.getBoundingClientRect().height).toBe(32);
  });

  it("keeps the A11y letterforms in the count at every size", async () => {
    // Regression: lg and xl set the `font` shorthand after the geometry, which reset it.
    await render(
      <div>
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <AvatarGroup key={size} people={PEOPLE} size={size} />
        ))}
      </div>,
    );
    const counts = [...document.querySelectorAll<HTMLElement>(".qx-avatar-group-more")];
    expect(counts.map((count) => getComputedStyle(count).fontSize)).toEqual([
      "12px",
      "12px",
      "14px",
      "14px",
    ]);
    for (const count of counts) {
      expect(getComputedStyle(count).fontVariationSettings).toBe('"GEOM" 0');
    }
  });

  it("formats counts and lists for the locale, in Hindi", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <AvatarGroup people={PEOPLE} total={1284} />
      </QeetrixProvider>,
    );
    const name = page.getByRole("img").element().getAttribute("aria-label") ?? "";
    expect(name).toMatch(/^1,284 लोग: /);
    expect(name).toContain("1,281 और");
  });

  it("is accessible and looks right in both colour schemes", async () => {
    await page.viewport(900, 320);
    const groups = [
      { name: "Engineering", people: PEOPLE, total: 412 },
      { name: "Admins", people: PEOPLE.slice(1, 3), total: 2 },
      { name: "Finance", people: PEOPLE.slice(3), total: 74 },
    ];
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 860,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card>
          <Table
            label="Groups"
            rows={groups}
            rowId={(group) => group.name}
            rowLabel={(group) => group.name}
            selectable
            defaultSelected={["Finance"]}
            columns={[
              { id: "name", header: "Group", cell: (group) => group.name },
              {
                id: "members",
                header: "Members",
                cell: (group) => <AvatarGroup people={group.people} total={group.total} />,
              },
            ]}
          />
        </Card>
        <Card title="Acme HR portal" level={2}>
          <div style={{ display: "grid", gap: 16 }}>
            <AvatarGroup people={PEOPLE} total={38} size="md" max={5} />
            <AvatarGroup people={PEOPLE} total={12} size="lg" />
          </div>
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotSchemes("AvatarGroup", "[data-qx-stage]");
  });

  it("is accessible and looks right as squares, for applications, in both colour schemes", async () => {
    const apps = ["Qeet Pay", "Qeet People", "Qeet Logs", "Qeet Notify", "Qeet ID", "Acme HR"].map(
      (name) => ({ name }),
    );
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 16 }}>
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <AvatarGroup
              key={size}
              people={apps}
              total={14}
              size={size}
              shape="square"
              messages={{ label: "{count} applications: {names}" }}
            />
          ))}
        </div>
      </Stage>,
    );
    await expect
      .element(page.getByRole("img").first())
      .toHaveAccessibleName(
        `14 applications: ${list(["Qeet Pay", "Qeet People", "Qeet Logs", "11 more"])}`,
      );
    await expectAccessible(container);
    await screenshotSchemes("AvatarGroup · square");
  });
});
