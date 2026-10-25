import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { settled } from "../../../tests/support/settled";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { FileUpload, type FileUploadItem } from "./file-upload";

const MB = 1_000_000;
const file = (name: string, bytes: number, type = "") =>
  new File([new Uint8Array(bytes)], name, { type });
const zone = () => document.querySelector(".qx-file-upload-zone") as HTMLElement;
const input = () => document.querySelector(".qx-file-upload-input") as HTMLInputElement;

/** Drag files over the zone and drop them, as a person would from their desktop. */
function drag(type: "dragenter" | "dragover" | "drop" | "dragleave", files: File[] = []) {
  const data = new DataTransfer();
  for (const each of files) data.items.add(each);
  zone().dispatchEvent(
    new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }),
  );
}

const ITEMS: FileUploadItem[] = [
  { id: "1", name: "acme-idp-metadata.xml", size: 12_000, status: "done" },
  { id: "2", name: "backup-metadata.xml", size: 15_000, status: "uploading", progress: 60 },
  {
    id: "3",
    name: "old-metadata.xml",
    size: 9_000,
    status: "error",
    error: "The server refused it",
  },
];

describe("FileUpload", () => {
  it("is a file input named by its Field, with a hint written from accept and maxSize", async () => {
    await render(
      <Field label="Identity provider metadata">
        <FileUpload accept=".xml" maxSize={MB} />
      </Field>,
    );
    const control = page.getByLabelText("Identity provider metadata");
    await expect.element(control).toHaveAttribute("type", "file");
    await expect.element(control).toHaveAttribute("accept", ".xml");
    await expect.element(page.getByText("Drag a file here, or browse")).toBeVisible();
    const hint = page.getByText("XML, up to 1 MB");
    await expect.element(hint).toBeVisible();
    expect(input().getAttribute("aria-describedby")).toContain(hint.element().id);
  });

  it("passes the files that fit to onSelect, and lists the rest with the reason", async () => {
    const onSelect = vi.fn();
    await render(
      <FileUpload aria-label="Metadata" accept=".xml" maxSize={MB} multiple onSelect={onSelect} />,
    );
    await userEvent.upload(input(), [
      file("good.xml", 2_000, "application/xml"),
      file("notes.txt", 100, "text/plain"),
      file("huge.xml", 2 * MB, "application/xml"),
    ]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].map((each: File) => each.name)).toEqual(["good.xml"]);
    await expect.element(page.getByText("Only XML files can be used here")).toBeVisible();
    await expect.element(page.getByText("Larger than 1 MB")).toBeVisible();
    expect(page.getByText("Not uploaded").all()).toHaveLength(2);

    await page.getByRole("button", { name: "Remove notes.txt" }).click();
    expect(page.getByText("notes.txt").query()).toBeNull();
    await expect.element(page.getByLabelText("Metadata")).toHaveFocus();
  });

  it("turns Ember while a file is dragged over, and takes the dropped file", async () => {
    const onSelect = vi.fn();
    await render(<FileUpload aria-label="Metadata" accept=".xml" onSelect={onSelect} />);
    drag("dragenter");
    await expect.poll(() => zone().hasAttribute("data-dragging")).toBe(true);
    await expect.element(page.getByText("Drop to upload")).toBeVisible();
    await settled();
    expect(getComputedStyle(zone()).borderTopColor).toBe(tokenColor("--qx-color-border-brand"));
    drag("drop", [file("acme.xml", 500, "application/xml")]);
    await expect.poll(() => onSelect.mock.calls.length).toBe(1);
    expect(zone().hasAttribute("data-dragging")).toBe(false);
  });

  it("takes one file at a time unless multiple", async () => {
    const onSelect = vi.fn();
    await render(<FileUpload aria-label="Logo" onSelect={onSelect} />);
    drag("drop", [file("a.png", 10, "image/png"), file("b.png", 10, "image/png")]);
    await expect.poll(() => onSelect.mock.calls.length).toBe(1);
    expect(onSelect.mock.calls[0]?.[0]).toHaveLength(1);
    await expect.element(page.getByText("Choose one file at a time")).toBeVisible();
  });

  it("shows each upload's status, and its remove button calls onRemove", async () => {
    const onRemove = vi.fn();
    await render(<FileUpload aria-label="Metadata" items={ITEMS} onRemove={onRemove} />);
    await expect.element(page.getByText("Uploaded", { exact: true })).toBeVisible();
    await expect
      .element(page.getByRole("progressbar", { name: "Uploading backup-metadata.xml" }))
      .toHaveAttribute("aria-valuenow", "60");
    await expect.element(page.getByText("The server refused it")).toBeVisible();
    await expect.element(page.getByText("12 kB")).toBeVisible();
    await page.getByRole("button", { name: "Remove old-metadata.xml" }).click();
    expect(onRemove).toHaveBeenCalledWith("3");
  });

  it("writes sizes in the locale's words", async () => {
    await render(
      <FileUpload
        aria-label="Files"
        items={[
          { id: "a", name: "a.txt", size: 512 },
          { id: "b", name: "b.txt", size: 1_500_000 },
        ]}
      />,
    );
    await expect.element(page.getByText("512 bytes")).toBeVisible();
    await expect.element(page.getByText("1.5 MB")).toBeVisible();
  });

  it("follows Field: its error shows, and the zone's border turns danger", async () => {
    await render(
      <Field label="Identity provider metadata" error="Upload the metadata to continue">
        <FileUpload accept=".xml" />
      </Field>,
    );
    await expect.element(page.getByText("Upload the metadata to continue")).toBeVisible();
    await expect
      .element(page.getByLabelText("Identity provider metadata"))
      .toHaveAttribute("aria-invalid", "true");
    expect(getComputedStyle(zone()).borderTopColor).toBe(tokenColor("--qx-color-border-danger"));
  });

  it("ignores drops while disabled", async () => {
    const onSelect = vi.fn();
    await render(<FileUpload aria-label="Metadata" disabled onSelect={onSelect} />);
    await expect.element(page.getByLabelText("Metadata")).toBeDisabled();
    drag("dragenter");
    drag("drop", [file("acme.xml", 10)]);
    expect(zone().hasAttribute("data-dragging")).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <FileUpload aria-label="मेटाडेटा" accept=".xml" maxSize={MB} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByText("फ़ाइल यहाँ खींचकर लाएँ, या ब्राउज़ करें")).toBeVisible();
    await expect.element(page.getByText(/^XML, 1 MB तक$/)).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(760, 520);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 720,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Field label="Identity provider metadata">
          <FileUpload accept=".xml" maxSize={MB} items={ITEMS} onRemove={() => {}} />
        </Field>
        <Field label="Logo" optional>
          <FileUpload accept=".png,.svg" maxSize={MB} />
        </Field>
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("FileUpload", "[data-qx-stage]");
    // The second zone, as a file is dragged over it.
    const second = document.querySelectorAll<HTMLElement>(".qx-file-upload-zone")[1];
    const enter = { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() };
    second?.dispatchEvent(new DragEvent("dragenter", enter));
    await expect.poll(() => document.querySelector("[data-dragging]")).not.toBeNull();
    await screenshotEveryMode("FileUpload · dragging", "[data-qx-stage]");
  });
});
