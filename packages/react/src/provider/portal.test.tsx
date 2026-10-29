import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../menu/menu";
import { Select } from "../select/select";
import { PortalContainer } from "./provider";

function DialogWithMenu({ onRename }: { onRename: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [plan, setPlan] = useState<string | null>("free");
  return (
    <>
      <Button onClick={() => dialog.current?.showModal()}>Open</Button>
      <dialog ref={dialog} aria-label="Navigation">
        <PortalContainer container={dialog}>
          <Menu>
            <MenuTrigger render={<Button variant="soft">Theme</Button>} />
            <MenuContent>
              <MenuItem onClick={onRename}>Rename</MenuItem>
            </MenuContent>
          </Menu>
          <Select
            aria-label="Plan"
            value={plan}
            onValueChange={setPlan}
            items={[
              { value: "free", label: "Free" },
              { value: "team", label: "Team" },
            ]}
          />
        </PortalContainer>
      </dialog>
    </>
  );
}

describe("PortalContainer", () => {
  it("renders popups inside a native modal dialog, where they can be used", async () => {
    const onRename = vi.fn();
    await render(<DialogWithMenu onRename={onRename} />);
    await userEvent.click(page.getByRole("button", { name: "Open" }));
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    await userEvent.click(page.getByRole("button", { name: "Theme" }));
    const item = page.getByRole("menuitem", { name: "Rename" });
    await expect.element(item).toBeVisible();
    expect(dialog.contains(item.element())).toBe(true);
    await userEvent.click(item);
    expect(onRename).toHaveBeenCalledOnce();

    await userEvent.click(page.getByRole("combobox", { name: "Plan" }));
    const team = page.getByRole("option", { name: "Team" });
    expect(dialog.contains(team.element())).toBe(true);
    await userEvent.click(team);
    await expect.element(page.getByRole("combobox", { name: "Plan" })).toHaveTextContent("Team");
    dialog.close();
  });
});
