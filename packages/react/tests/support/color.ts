/** The computed colour a token resolves to here, in the form getComputedStyle reports colours. */
export function tokenColor(token: `--qx-${string}`): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** A CSS colour (any form getComputedStyle reports, oklch included) as sRGB bytes, via a canvas. */
export function srgb(color: string): [number, number, number] {
  const context = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** The WCAG 2 contrast ratio between two opaque CSS colours. */
export function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const [r, g, b] = srgb(color).map((byte) => {
      const c = byte / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}
