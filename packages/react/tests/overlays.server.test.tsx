/**
 * The overlays on the server: closed, each renders only its trigger, so a page with a dozen menus
 * ships no hidden markup; the IconButton tooltip adds no element of its own.
 */
import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToastProvider,
  Tooltip,
} from "../src/index";

const html = (node: React.ReactElement) => renderToString(node);

describe("overlays render on the server", () => {
  it("closed overlays render only their triggers", () => {
    const out = html(
      <>
        <Dialog>
          <DialogTrigger render={<Button>Rename</Button>} />
          <DialogContent title="Rename invoice" />
        </Dialog>
        <Drawer>
          <DrawerTrigger render={<Button>Edit</Button>} />
          <DrawerContent title="Edit customer" />
        </Drawer>
        <Popover>
          <PopoverTrigger render={<Button>Filter</Button>} />
          <PopoverContent title="Filters" />
        </Popover>
        <Menu>
          <MenuTrigger render={<Button>Actions</Button>} />
          <MenuContent>
            <MenuItem>Edit</MenuItem>
          </MenuContent>
        </Menu>
      </>,
    );
    expect(out).not.toContain("Rename invoice");
    expect(out).not.toContain("Edit customer");
    expect(out).not.toContain("Filters");
    expect(out).toContain('aria-haspopup="menu"');
    expect(out.match(/<button/g)).toHaveLength(4);
  });

  it("a tooltip wraps its trigger without an element of its own", () => {
    const out = html(<IconButton icon={DownloadIcon} aria-label="Download" />);
    expect(out).toMatch(/^<button[^>]*aria-label="Download"/);
    expect(
      html(
        <Tooltip content="Hi">
          <Button>Go</Button>
        </Tooltip>,
      ),
    ).toMatch(/^<button/);
  });

  it("ToastProvider renders its children", () => {
    expect(
      html(
        <ToastProvider>
          <p>app</p>
        </ToastProvider>,
      ),
    ).toContain("<p>app</p>");
  });
});
