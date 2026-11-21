/**
 * The Layer 1 exit screen (charter Phase 4; 06-component-specs.md, Phase 4 close-out): a complete
 * sign-in screen built from primitives alone, following the welcoming-page rules (design rules
 * §17): comfortable density, a Geo display headline, one column at most 400px wide.
 */
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { FingerprintPatternIcon } from "@qeetrix/icons/icons/fingerprint-pattern";
import { MailIcon } from "@qeetrix/icons/icons/mail";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Button,
  Checkbox,
  Heading,
  Inline,
  Link,
  QeetrixProvider,
  Separator,
  SkipLink,
  Stack,
  Text,
  TextField,
} from "../src/index";
import { expectAccessible } from "./support/axe";
import { tab } from "./support/keyboard";
import { canEmulateMedia, emulateMedia } from "./support/media";
import { screenshotSchemes } from "./support/screenshots";

function SignIn() {
  return (
    <div
      data-qx-density="comfortable"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "auto",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--qx-color-surface-canvas)",
        color: "var(--qx-color-text-default)",
        font: "var(--qx-typography-body-md)",
      }}
    >
      <SkipLink href="#sign-in" />
      <main id="sign-in" style={{ inlineSize: "min(400px, 100%)" }}>
        <Stack gap="xl">
          <Stack gap="xs">
            <Heading level={1} size="display-sm">
              Sign in to Qeet
            </Heading>
            <Text tone="subtle">One account for every Qeet product.</Text>
          </Stack>
          <Stack
            gap="lg"
            render={<form aria-label="Sign in" onSubmit={(e) => e.preventDefault()} />}
          >
            <TextField
              label="Work email"
              type="email"
              name="email"
              icon={MailIcon}
              placeholder="e.g. priya@acme.in"
              autoComplete="username webauthn"
              required
            />
            <Checkbox label="Keep me signed in" name="remember" />
            <Button type="submit" icon={FingerprintPatternIcon} fullWidth size="lg">
              Continue with passkey
            </Button>
          </Stack>
          <Inline gap="md" wrap={false}>
            <Separator decorative style={{ flex: 1 }} />
            <Text size="sm" tone="subtle">
              or
            </Text>
            <Separator decorative style={{ flex: 1 }} />
          </Inline>
          <Button variant="soft" icon={ArrowRightIcon} fullWidth size="lg">
            Use a password
          </Button>
          <Stack gap="xs" align="center">
            <Text size="sm">
              New to Qeet? <Link href="#sign-up">Create an account</Link>
            </Text>
            <Link href="#help" tone="subtle">
              <Text size="sm">Trouble signing in?</Text>
            </Link>
          </Stack>
        </Stack>
      </main>
    </div>
  );
}

const html = document.documentElement;
let reset: (() => Promise<void>) | undefined;
afterEach(async () => {
  await reset?.();
  reset = undefined;
  html.removeAttribute("dir");
});

describe("the sign-in screen, from primitives alone", () => {
  it("is in a sensible keyboard order", async () => {
    await render(<SignIn />);
    const expected = [
      page.getByRole("link", { name: "Skip to main content" }),
      page.getByRole("textbox", { name: "Work email" }),
      page.getByRole("checkbox", { name: "Keep me signed in" }),
      page.getByRole("button", { name: "Continue with passkey" }),
      page.getByRole("button", { name: "Use a password" }),
      page.getByRole("link", { name: "Create an account" }),
      page.getByRole("link", { name: "Trouble signing in?" }),
    ].map((locator) => locator.element());
    const visited: Element[] = [];
    for (let i = 0; i < expected.length; i++) {
      await tab();
      visited.push(document.activeElement as Element);
    }
    expect(visited).toEqual(expected);
  });

  // Signing in is never a large field (design rules §8): the email is md, as tall as the lg button.
  it("asks for the email in an md field, one height with the lg button in every density", async () => {
    const { container } = await render(<SignIn />);
    const screen = container.querySelector("[data-qx-density]") as HTMLElement;
    const field = container.querySelector("[data-slot=input]") as HTMLElement;
    const button = page.getByRole("button", { name: "Continue with passkey" }).element();
    expect(field.dataset.size).toBe("md");
    for (const density of ["compact", "default", "comfortable"]) {
      screen.dataset.qxDensity = density;
      const height = (element: Element) => element.getBoundingClientRect().height;
      expect(height(field), density).toBe(height(button));
    }
    const value = getComputedStyle(container.querySelector("input") as HTMLInputElement);
    expect([value.fontSize, value.fontWeight]).toEqual(["14px", "400"]);
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(560, 720);
    const { container } = await render(<SignIn />);
    await expectAccessible(container);
    await screenshotSchemes("Sign-in", null);
  });

  it("mirrors in right-to-left", async () => {
    await page.viewport(560, 720);
    html.dir = "rtl";
    await render(
      <QeetrixProvider direction="rtl">
        <SignIn />
      </QeetrixProvider>,
    );
    await screenshotSchemes("Sign-in · right-to-left", null);
  });

  it.runIf(canEmulateMedia)("stays usable in forced colours", async () => {
    await page.viewport(560, 720);
    await render(<SignIn />);
    reset = await emulateMedia({ "forced-colors": "active" });
    await screenshotSchemes("Sign-in · forced colours", null);
  });
});
