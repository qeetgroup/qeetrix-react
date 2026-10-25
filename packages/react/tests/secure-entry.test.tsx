/**
 * The exit for increment C2 (07-components.md): secure entry in Qeet ID's own screens. Two-step
 * sign-in on a welcoming page (OTPInput, an urgent Alert), and a console page where a new client
 * secret is shown once (PasswordInput, CopyButton, Alerts, including AppShell's notifications).
 */
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Alert,
  CopyButton,
  OTPInput,
  PageContent,
  PageHeader,
  PasswordInput,
} from "../src/experimental";
import { Badge, Button, Card, Field, Heading, Link, Stack, Table, Text } from "../src/index";
import { QeetIdFrame } from "./fixtures/qeet-id-console";
import { expectAccessible } from "./support/axe";
import { screenshotSchemes } from "./support/screenshots";

function TwoStep({ failed = false }: { failed?: boolean }) {
  return (
    <div
      data-qx-density="comfortable"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--qx-color-surface-canvas)",
        color: "var(--qx-color-text-default)",
        font: "var(--qx-typography-body-md)",
      }}
    >
      <main style={{ inlineSize: "min(400px, 100%)" }}>
        <Stack gap="xl">
          <Stack gap="xs">
            <Heading level={1} size="heading-md">
              Check your authenticator
            </Heading>
            <Text tone="subtle">Enter the 6-digit code for priya@acme.in.</Text>
          </Stack>
          {failed && (
            <Alert tone="danger" title="That code didn't work" announce="urgent">
              Codes change every 30 seconds. Enter the newest one.
            </Alert>
          )}
          <form aria-label="Two-step sign-in" onSubmit={(event) => event.preventDefault()}>
            <Stack gap="lg">
              <Field label="Verification code" invalid={failed}>
                {/* A failed attempt clears the code. */}
                <OTPInput key={String(failed)} size="lg" defaultValue={failed ? "" : "4817"} />
              </Field>
              <Button type="submit" fullWidth size="lg" icon={ArrowRightIcon}>
                Verify
              </Button>
              <Link href="#recovery">Use a recovery code instead</Link>
            </Stack>
          </form>
        </Stack>
      </main>
    </div>
  );
}

const SECRET = "qs_live_9f2c7d1e4b8a6c3f";
const KEYS = [
  ["Billing service", "key_7Hk2pQ", "Production", "2 days ago"],
  ["Staging worker", "key_3Lm9vR", "Development", "5 minutes ago"],
  ["Mobile app", "key_8Xc4tN", "Production", "yesterday"],
] as const;

function ApiKeys() {
  return (
    <QeetIdFrame
      current="keys"
      env="development"
      notifications={
        <Alert title="You're in Development">
          Test users and keys only. Nothing here reaches production.
        </Alert>
      }
    >
      <PageHeader
        title="API keys"
        description="Server-side credentials for Qeet ID's APIs."
        actions={<Button icon={PlusIcon}>Create key</Button>}
      />
      <PageContent>
        <Alert tone="warning" title="Copy this client secret now">
          <Stack gap="sm">
            <Text tone="subtle">It's stored hashed, so it can't be shown again.</Text>
            <Field label="Client secret · Staging worker" style={{ maxInlineSize: 480 }}>
              <PasswordInput
                readOnly
                autoComplete="off"
                defaultValue={SECRET}
                endAdornment={<CopyButton value={SECRET} label="Copy client secret" size="sm" />}
              />
            </Field>
          </Stack>
        </Alert>
        <Card>
          <Table
            label="API keys"
            rows={KEYS}
            rowId={([, id]) => id}
            rowLabel={([name]) => name}
            columns={[
              { id: "name", header: "Name", cell: ([name]) => name },
              {
                id: "key",
                header: "Key ID",
                cell: ([, id]) => (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Text mono size="sm">
                      {id}
                    </Text>
                    <CopyButton value={id} label={`Copy key ID ${id}`} size="sm" />
                  </span>
                ),
              },
              {
                id: "environment",
                header: "Environment",
                cell: ([, , env]) => (
                  <Badge tone={env === "Production" ? "success" : "warning"}>{env}</Badge>
                ),
              },
              { id: "used", header: "Last used", cell: ([, , , used]) => used, align: "end" },
            ]}
          />
        </Card>
      </PageContent>
    </QeetIdFrame>
  );
}

describe("C2 exit: secure entry in Qeet ID", () => {
  it("two-step sign-in: the code, then a failed attempt", async () => {
    await page.viewport(1280, 760);
    const screen = await render(<TwoStep />);
    await expectAccessible(screen.container);
    await screenshotSchemes("Secure entry · two-step sign-in", null);
    await screen.rerender(<TwoStep failed />);
    await expect.element(page.getByRole("alert")).toBeVisible();
    await expect
      .element(page.getByRole("textbox", { name: "Verification code" }))
      .toHaveAttribute("aria-invalid", "true");
    await screenshotSchemes("Secure entry · two-step sign-in · failed", null);
  });

  it("a new client secret, shown once, copied from the field", async () => {
    await page.viewport(1440, 900);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = await render(<ApiKeys />);
    await expectAccessible(container);
    await screenshotSchemes("Secure entry · client secret", null);
    await page.getByRole("button", { name: "Show password" }).click();
    await page.getByRole("button", { name: "Copy client secret" }).click();
    await expect.poll(() => writeText.mock.calls[0]?.[0]).toBe(SECRET);
    await userEvent.hover(page.getByRole("button", { name: "Copy client secret" }));
    await screenshotSchemes("Secure entry · client secret · copied", null);
  });
});
