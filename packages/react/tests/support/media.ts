import { cdp, server } from "vitest/browser";

/** Media emulation runs through the Chrome DevTools Protocol, so only Chromium has it. */
export const canEmulateMedia: boolean = server.browser === "chromium";

type Feature = "forced-colors" | "prefers-reduced-motion" | "prefers-color-scheme";

/**
 * Emulate media features, such as forced colours (Windows High Contrast) or reduced motion, until
 * the returned function resets them.
 */
export async function emulateMedia(
  features: Partial<Record<Feature, string>>,
): Promise<() => Promise<void>> {
  const session = cdp();
  await session.send("Emulation.setEmulatedMedia", {
    features: Object.entries(features).map(([name, value]) => ({ name, value })),
  });
  return async () => {
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  };
}

/** The computed value of a CSS system colour in the current mode, e.g. `Highlight`. */
export function systemColor(name: string): string {
  const probe = document.createElement("span");
  probe.style.setProperty("forced-color-adjust", "none");
  probe.style.color = name;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}
