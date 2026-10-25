import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Button } from "../../button/button";
import { Card } from "../../card/card";
import { Field } from "../../field/field";
import { CopyButton } from "../copy-button/copy-button";
import { OTPInput } from "../otp-input/otp-input";
import { encodeQr } from "./encode";
import { QRCode } from "./qr-code";

const OTPAUTH =
  "otpauth://totp/Acme%20Pvt%20Ltd:priya@acme.in?secret=JBSWY3DPEHPK3PXP&issuer=Acme%20Pvt%20Ltd";
const UPI = "upi://pay?pa=acme@qeetpay&pn=Acme%20Pvt%20Ltd&am=124500.00&cu=INR";

const svg = () => document.querySelector<SVGSVGElement>("[data-slot=qr-code]") as SVGSVGElement;

/** Where a browser can read barcodes itself (Chrome on macOS, Android), read ours. */
declare const BarcodeDetector:
  | undefined
  | (new (options: {
      formats: string[];
    }) => {
      detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
    });

describe("QRCode", () => {
  it("is one image, named by its label", async () => {
    await render(<QRCode value={OTPAUTH} label="QR code to add Acme to your authenticator app" />);
    await expect
      .element(page.getByRole("img"))
      .toHaveAccessibleName("QR code to add Acme to your authenticator app");
  });

  it("fills its size, leaving the four-module quiet zone on every side", async () => {
    await render(<QRCode value={OTPAUTH} label="Scan" size={200} />);
    const count = encodeQr(OTPAUTH).length;
    const box = svg().getBoundingClientRect();
    expect([box.width, box.height]).toEqual([200, 200]);
    expect(svg().getAttribute("viewBox")).toBe(`-4 -4 ${count + 8} ${count + 8}`);
    // The finder patterns reach the code's corners, so the drawing is exactly the code.
    const drawn = (svg().querySelector("path") as SVGPathElement).getBBox();
    expect([drawn.x, drawn.y, drawn.width, drawn.height]).toEqual([0, 0, count, count]);
  });

  it("stays dark on white in the dark colour scheme", async () => {
    await render(
      <div data-qx-color-scheme="dark">
        <QRCode value={UPI} label="Pay Acme Pvt Ltd" />
        <span
          data-qx-color-scheme="light"
          data-probe=""
          style={{ color: "var(--qx-color-text-default)" }}
        />
      </div>,
    );
    const style = getComputedStyle(svg());
    const light = getComputedStyle(document.querySelector("[data-probe]") as HTMLElement).color;
    expect(style.backgroundColor).toBe("oklch(1 0 0)");
    expect(style.fill).toBe(light);
  });

  it.runIf(typeof BarcodeDetector !== "undefined")(
    "reads back with the browser's own detector",
    async () => {
      for (const [value, level] of [
        [OTPAUTH, "M"],
        [UPI, "H"],
        ["नमस्ते — Qeet ID", "Q"],
      ] as const) {
        const screen = await render(<QRCode value={value} label="Scan" level={level} size={240} />);
        // The same drawing, with its colours written in, as an image a canvas can hold.
        const copy = svg().cloneNode(true) as SVGSVGElement;
        copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        copy.setAttribute("style", `background:#fff;fill:${getComputedStyle(svg()).fill}`);
        const image = new Image();
        image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 240;
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        context.fillStyle = "#fff";
        context.fillRect(0, 0, 240, 240);
        context.drawImage(image, 0, 0);
        const detector = new (BarcodeDetector as NonNullable<typeof BarcodeDetector>)({
          formats: ["qr_code"],
        });
        const [found] = await detector.detect(canvas);
        expect(found?.rawValue).toBe(value);
        await screen.unmount();
      }
    },
  );

  it("is accessible and looks right in both colour schemes", async () => {
    await page.viewport(1000, 440);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.35fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 960,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card
          title="Set up an authenticator app"
          level={2}
          footer={<Button>Verify and turn on</Button>}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <QRCode
              value={OTPAUTH}
              label="QR code to add Acme to your authenticator app"
              size={168}
            />
            <div style={{ display: "grid", gap: 16 }}>
              <p style={{ margin: 0 }}>
                1. Scan this with Google Authenticator, Microsoft Authenticator or any TOTP app.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <code>JBSW Y3DP EHPK 3PXP</code>
                <CopyButton value="JBSWY3DPEHPK3PXP" label="Copy the key" />
              </div>
              <Field label="2. Enter the 6-digit code it shows">
                <OTPInput />
              </Field>
            </div>
          </div>
        </Card>
        <Card
          title="Pay Acme Pvt Ltd"
          description="Qeet Pay checkout: scan with any UPI app."
          level={2}
        >
          <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
            <strong style={{ font: "var(--qx-typography-title-md)" }}>₹1,24,500.00</strong>
            <QRCode value={UPI} label="QR code to pay ₹1,24,500.00 to Acme Pvt Ltd" size={180} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              UPI ID <code>acme@qeetpay</code>
              <CopyButton value="acme@qeetpay" label="Copy the UPI ID" />
            </div>
          </div>
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotSchemes("QRCode", "[data-qx-stage]");
  });
});
