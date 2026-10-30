/**
 * Reduced motion: every duration collapses to 0, and a wait stays visible: Spinner and an
 * indeterminate Progress fade instead of moving (06-component-specs.md, Phase 4 close-out).
 */
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Progress } from "../src/progress/progress";
import { Skeleton } from "../src/skeleton/skeleton";
import { Spinner } from "../src/spinner/spinner";
import { canEmulateMedia, emulateMedia } from "./support/media";

let reset: (() => Promise<void>) | undefined;
afterEach(async () => {
  await reset?.();
  reset = undefined;
});

const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement;

describe.runIf(canEmulateMedia)("reduced motion", () => {
  it("collapses every duration and keeps waits visible", async () => {
    await render(
      <>
        <Spinner />
        <Progress aria-label="Importing" value={null} />
        <Skeleton />
      </>,
    );
    reset = await emulateMedia({ "prefers-reduced-motion": "reduce" });
    const root = getComputedStyle(document.documentElement);
    expect(root.getPropertyValue("--qx-motion-duration-normal").trim()).toBe("0ms");
    expect(getComputedStyle(slot("spinner")).animationName).toBe("qx-spinner-fade");
    expect(getComputedStyle(slot("progress-indicator")).animationName).toBe("qx-progress-fade");
    expect(getComputedStyle(slot("skeleton")).animationDuration).toBe("0s");
  });

  it("fades indeterminate Progress in right to left too (QTRX-166)", async () => {
    await render(
      <div dir="rtl">
        <Progress aria-label="Importing" value={null} />
      </div>,
    );
    expect(getComputedStyle(slot("progress-indicator")).animationName).toBe(
      "qx-progress-slide-rtl",
    );
    reset = await emulateMedia({ "prefers-reduced-motion": "reduce" });
    expect(getComputedStyle(slot("progress-indicator")).animationName).toBe("qx-progress-fade");
  });
});
