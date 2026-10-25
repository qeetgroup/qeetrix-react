import { page } from "vitest/browser";

/**
 * Where an element's dark ink sits, from its pixels: how far the ink's middle is from the element's
 * middle, in CSS px (negative is high or to the start). Font metrics can't answer this; only the
 * rendered glyphs can. Render the element under `zoom` for sub-pixel precision and pass the zoom.
 */
export async function inkOffset(
  element: HTMLElement,
  zoom: number,
  dark = 110,
): Promise<{ vertical: number; horizontal: number }> {
  const shot = (await page.screenshot({ element, base64: true, save: false })) as unknown;
  const base64 = typeof shot === "string" ? shot : (shot as { base64: string }).base64;
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, image.width, image.height);
  let [top, bottom, left, right] = [image.height, -1, image.width, -1];
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      const luminance =
        0.299 * (data[i] ?? 255) + 0.587 * (data[i + 1] ?? 255) + 0.114 * (data[i + 2] ?? 255);
      if (luminance < dark) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  return {
    vertical: ((top + bottom) / 2 - (image.height - 1) / 2) / zoom,
    horizontal: ((left + right) / 2 - (image.width - 1) / 2) / zoom,
  };
}
