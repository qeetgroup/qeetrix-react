import { argosScreenshot } from "@argos-ci/vitest";

const SCHEMES = ["light", "dark"] as const;
const DENSITIES = ["compact", "default", "comfortable"] as const;

/**
 * Density changes only five tokens (design rules §6): size.control.sm/md/lg, size.row and
 * space.form-gap. A component that uses none of them looks identical at every density, so it gets one
 * screenshot per colour scheme; a component that uses any of them gets every density too.
 * tests/screenshot-coverage.server.test.ts enforces the choice from each family's CSS.
 */
async function capture(name: string, densities: readonly string[], element: string): Promise<void> {
  const html = document.documentElement;
  for (const scheme of SCHEMES) {
    for (const density of densities) {
      html.dataset.qxColorScheme = scheme;
      html.dataset.qxDensity = density;
      await argosScreenshot(
        densities.length > 1 ? `${name} · ${scheme} · ${density}` : `${name} · ${scheme}`,
        {
          element,
        },
      );
    }
  }
  delete html.dataset.qxColorScheme;
  delete html.dataset.qxDensity;
}

/** Two screenshots, light and dark, for a component that doesn't change with density. */
export async function screenshotSchemes(name: string, element = "[data-qx-stage]"): Promise<void> {
  await capture(name, ["default"], element);
}

/** Six screenshots, both schemes × three densities, for a component that uses density tokens. */
export async function screenshotEveryMode(
  name: string,
  element = "[data-qx-stage]",
): Promise<void> {
  await capture(name, DENSITIES, element);
}
