import { argosScreenshot } from "@argos-ci/vitest";

const SCHEMES = ["light", "dark"] as const;
const DENSITIES = ["compact", "default", "comfortable"] as const;

/**
 * Capture the current render once per colour scheme and density: six screenshots, named
 * `<name> · <scheme> · <density>`, cropped to the test's <Stage>. Argos compares each against the
 * main branch and shows every visual change on the pull request.
 */
export async function screenshotEveryMode(
  name: string,
  element = "[data-qx-stage]",
): Promise<void> {
  const html = document.documentElement;
  for (const scheme of SCHEMES) {
    for (const density of DENSITIES) {
      html.dataset.qxColorScheme = scheme;
      html.dataset.qxDensity = density;
      await argosScreenshot(`${name} · ${scheme} · ${density}`, { element });
    }
  }
  delete html.dataset.qxColorScheme;
  delete html.dataset.qxDensity;
}
