import type { ComponentProps, ReactElement } from "react";
import { cx } from "../../internal/cx";
import { encodeQr, type QRCodeLevel } from "./encode";

export type { QRCodeLevel } from "./encode";

export interface QRCodeProps
  extends Omit<ComponentProps<"svg">, "children" | "role" | "width" | "height" | "viewBox"> {
  /** The text to encode, as UTF-8: an `otpauth://` link, a UPI payment link. */
  value: string;
  /** What it's for, read in place of the image: "QR code to add Acme to your authenticator app". */
  label: string;
  /**
   * How much damage it survives: `L` 7%, `M` 15%, `Q` 25%, `H` 30%. Higher means denser. Default
   * `M`.
   */
  level?: QRCodeLevel;
  /** The side in px, the quiet zone included. Default 160. */
  size?: number;
}

/**
 * A QR code (07-components.md): text a phone camera can read, for authenticator setup and UPI
 * payments. Our own encoder. Always dark on white, whatever the colour scheme or forced colours,
 * with the standard's quiet zone of four modules inside the tile, drawn in whole modules with crisp
 * edges. Pair it with the same thing as text for anyone who can't scan: the key, the UPI ID. Too
 * long a `value` for the level throws a RangeError.
 */
export function QRCode({
  value,
  label,
  level = "M",
  size = 160,
  className,
  ...props
}: QRCodeProps): ReactElement {
  const modules = encodeQr(value, level);
  const count = modules.length;
  // In module units, a run of dark modules to a rectangle; the view adds the four-module quiet zone.
  let path = "";
  modules.forEach((row, y) => {
    for (let x = 0; x < count; x++) {
      if (!row[x]) continue;
      const start = x;
      while (row[x + 1]) x++;
      path += `M${start} ${y}h${x - start + 1}v1h${start - x - 1}z`;
    }
  });
  return (
    <svg
      viewBox={`-4 -4 ${count + 8} ${count + 8}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      {...props}
      className={cx("qx-qr-code", className)}
      data-slot="qr-code"
      data-qx-color-scheme="light"
    >
      <path d={path} />
    </svg>
  );
}
