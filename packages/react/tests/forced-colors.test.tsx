/**
 * Forced colours (Windows High Contrast): the browser drops fills and shadows and repaints in system
 * colours. Every state a primitive shows through a fill must survive (06-component-specs.md,
 * Phase 4 close-out). Chromium only: emulation runs through the DevTools Protocol.
 */
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Badge } from "../src/badge/badge";
import { Button } from "../src/button/button";
import { Checkbox } from "../src/checkbox/checkbox";
import { Input } from "../src/input/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../src/menu/menu";
import { Progress } from "../src/progress/progress";
import { Separator } from "../src/separator/separator";
import { Slider } from "../src/slider/slider";
import { Switch } from "../src/switch/switch";
import { Tab, Tabs, TabsList } from "../src/tabs/tabs";
import { Toggle } from "../src/toggle/toggle";
import { canEmulateMedia, emulateMedia, systemColor } from "./support/media";
import { settled } from "./support/settled";

let reset: (() => Promise<void>) | undefined;
afterEach(async () => {
  await reset?.();
  reset = undefined;
});

const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement;
const style = (name: string) => getComputedStyle(slot(name));

function Controls() {
  return (
    <>
      <Button>Save</Button>
      <Input aria-label="Name" />
      <Toggle defaultPressed aria-label="Bold">
        B
      </Toggle>
      <Switch aria-label="Auto-renew" defaultChecked />
      <Checkbox aria-label="GST" defaultChecked />
      <Slider aria-label="Discount" defaultValue={40} />
      <Progress aria-label="Upload" value={40} />
      <Tabs defaultValue="a">
        <TabsList>
          <Tab value="a">All</Tab>
          <Tab value="b">Paid</Tab>
        </TabsList>
      </Tabs>
      <Badge>Paid</Badge>
      <Separator />
    </>
  );
}

describe.runIf(canEmulateMedia)("forced colours", () => {
  it("changes nothing in normal colours", async () => {
    await render(<Controls />);
    expect(style("button").borderTopWidth).toBe("0px");
    expect(style("input").borderTopWidth).toBe("0px");
  });

  it("gives fill-only surfaces a system-colour edge", async () => {
    await render(<Controls />);
    reset = await emulateMedia({ "forced-colors": "active" });
    for (const name of ["button", "input", "badge"]) {
      expect(style(name).borderTopStyle, name).toBe("solid");
      expect(style(name).borderTopWidth, name).toBe("1px");
    }
  });

  it("shows every on state in the system highlight", async () => {
    await render(<Controls />);
    reset = await emulateMedia({ "forced-colors": "active" });
    // Fills transition, so read them once the switch to forced colours has settled.
    await settled();
    const highlight = systemColor("Highlight");
    expect(
      getComputedStyle(page.getByRole("button", { name: "Bold" }).element()).backgroundColor,
    ).toBe(highlight);
    expect(style("switch-track").backgroundColor).toBe(highlight);
    expect(style("checkbox-indicator").backgroundColor).toBe(highlight);
    expect(style("slider-indicator").backgroundColor).toBe(highlight);
    expect(style("progress-indicator").backgroundColor).toBe(highlight);
    expect(style("tabs-indicator").backgroundColor).toBe(highlight);
    expect(style("switch-thumb").backgroundColor).toBe(systemColor("HighlightText"));
  });

  it("keeps lines drawn as fills or shadows: separators and the tab list's base line", async () => {
    await render(<Controls />);
    reset = await emulateMedia({ "forced-colors": "active" });
    await settled();
    expect(style("separator").backgroundColor).toBe(systemColor("CanvasText"));
    expect(style("tabs-list").borderBottomWidth).toBe("2px");
  });

  it("marks the highlighted menu item in the system highlight", async () => {
    await render(
      <Menu>
        <MenuTrigger render={<Button>Actions</Button>} />
        <MenuContent>
          <MenuItem>Edit</MenuItem>
        </MenuContent>
      </Menu>,
    );
    reset = await emulateMedia({ "forced-colors": "active" });
    await page.getByRole("button", { name: "Actions" }).click();
    await userEvent.keyboard("{ArrowDown}");
    const item = page.getByRole("menuitem", { name: "Edit" }).element();
    await expect.poll(() => getComputedStyle(item).backgroundColor).toBe(systemColor("Highlight"));
  });
});
