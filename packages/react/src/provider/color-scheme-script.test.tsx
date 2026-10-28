import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { colorSchemeScript } from "./color-scheme-script";
import { QeetrixProvider, useColorScheme } from "./provider";

const html = document.documentElement;
const run = (script: string) => new Function(script)();

afterEach(() => {
  localStorage.clear();
  html.removeAttribute("data-qx-color-scheme");
});

function Choice() {
  const { colorScheme, setColorScheme } = useColorScheme();
  return (
    <button type="button" onClick={() => setColorScheme("dark")}>
      Scheme: {colorScheme}
    </button>
  );
}

describe("colorSchemeScript", () => {
  it("sets the saved scheme on <html> before React, and the system's for system", () => {
    localStorage.setItem("qx-color-scheme", "dark");
    run(colorSchemeScript());
    expect(html.getAttribute("data-qx-color-scheme")).toBe("dark");
    localStorage.setItem("site-theme", "system");
    run(colorSchemeScript({ storageKey: "site-theme" }));
    const system = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    expect(html.getAttribute("data-qx-color-scheme")).toBe(system);
  });

  it("falls back to the default when nothing (or nonsense) is saved", () => {
    localStorage.setItem("qx-color-scheme", "purple");
    run(colorSchemeScript({ defaultColorScheme: "light" }));
    expect(html.getAttribute("data-qx-color-scheme")).toBe("light");
  });

  it("is one fixed string for given options, so a CSP can allow it by hash", () => {
    expect(colorSchemeScript()).toBe(colorSchemeScript());
    expect(colorSchemeScript({ storageKey: "a" })).not.toBe(colorSchemeScript());
  });
});

describe("QeetrixProvider storageKey", () => {
  it("starts from the saved choice and saves a new one under the same key", async () => {
    localStorage.setItem("qx-color-scheme", "light");
    await render(
      <QeetrixProvider defaultColorScheme="system" storageKey="qx-color-scheme">
        <Choice />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button")).toHaveTextContent("Scheme: light");
    expect(html.getAttribute("data-qx-color-scheme")).toBe("light");
    await userEvent.click(page.getByRole("button"));
    expect(localStorage.getItem("qx-color-scheme")).toBe("dark");
    expect(html.getAttribute("data-qx-color-scheme")).toBe("dark");
  });
});
