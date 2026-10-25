import { CodeXmlIcon } from "@qeetrix/icons/icons/code-xml";
import { GlobeIcon } from "@qeetrix/icons/icons/globe";
import { KeyRoundIcon } from "@qeetrix/icons/icons/key-round";
import { MailIcon } from "@qeetrix/icons/icons/mail";
import { MonitorSmartphoneIcon } from "@qeetrix/icons/icons/monitor-smartphone";
import { ServerIcon } from "@qeetrix/icons/icons/server";
import { SmartphoneIcon } from "@qeetrix/icons/icons/smartphone";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Badge } from "../badge/badge";
import { Checkbox, CheckboxGroup } from "../checkbox/checkbox";
import { Radio, RadioGroup } from "../radio/radio";

function AppTypes(props: { onValueChange?: (value: string) => void; width?: number }) {
  return (
    <div style={{ inlineSize: props.width ?? 560 }}>
      <RadioGroup
        label="Application type"
        variant="tile"
        columns={2}
        defaultValue="web"
        {...(props.onValueChange ? { onValueChange: props.onValueChange } : {})}
      >
        <Radio
          value="web"
          icon={GlobeIcon}
          label="Web app"
          description="Server-rendered, keeps a client secret."
        />
        <Radio
          value="spa"
          icon={MonitorSmartphoneIcon}
          label="Single-page or mobile"
          description="Runs in the browser or a phone, with PKCE."
        />
        <Radio
          value="m2m"
          icon={ServerIcon}
          label="Machine to machine"
          description="A backend service, client credentials."
        />
        <Radio
          value="saml"
          icon={CodeXmlIcon}
          disabled
          label={
            <>
              SAML app <Badge tone="info">Enterprise</Badge>
            </>
          }
          description="An enterprise app on SAML 2.0."
        />
      </RadioGroup>
    </div>
  );
}

const tile = (name: RegExp) =>
  page.getByRole("radio", { name }).element().closest(".qx-choice") as HTMLElement;

describe("Choice tiles", () => {
  it("names each radio by its title and describes it by its line", async () => {
    await render(<AppTypes />);
    const web = page.getByRole("radio", { name: "Web app" });
    await expect.element(web).toBeChecked();
    await expect
      .element(web)
      .toHaveAccessibleDescription("Server-rendered, keeps a client secret.");
  });

  it("chooses a tile from a click anywhere on it, even its description", async () => {
    const onValueChange = vi.fn();
    await render(<AppTypes onValueChange={onValueChange} />);
    // The stretched label covers the description; the browser routes this click to it.
    await page.getByText("A backend service, client credentials.").click({ force: true });
    expect(onValueChange).toHaveBeenLastCalledWith("m2m", expect.anything());
    await expect.element(page.getByRole("radio", { name: "Machine to machine" })).toBeChecked();
    await settled();
    const chosen = tile(/Machine to machine/);
    expect(getComputedStyle(chosen).backgroundColor).toBe(tokenColor("--qx-color-bg-selected"));
    expect(getComputedStyle(chosen).boxShadow).toContain(tokenColor("--qx-color-border-brand"));
  });

  it("keeps the radio group's keys: one tab stop, arrows move and choose, disabled skipped", async () => {
    await render(<AppTypes />);
    await userEvent.tab();
    await expect.element(page.getByRole("radio", { name: "Web app" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(page.getByRole("radio", { name: "Single-page or mobile" })).toBeChecked();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    // SAML is disabled, so the arrows go round to the first.
    await expect.element(page.getByRole("radio", { name: "Web app" })).toBeChecked();
  });

  it("lays tiles out in up to N columns, one where it's narrow", async () => {
    const columns = () =>
      new Set(
        [...document.querySelectorAll(".qx-choice")].map(
          (each) => each.getBoundingClientRect().left,
        ),
      ).size;
    const { rerender } = await render(<AppTypes width={560} />);
    expect(columns()).toBe(2);
    await rerender(<AppTypes width={300} />);
    expect(columns()).toBe(1);
  });

  it("chooses several with checkbox tiles", async () => {
    const onValueChange = vi.fn();
    await render(
      <CheckboxGroup
        label="Sign-in methods"
        variant="tile"
        defaultValue={["passkey"]}
        onValueChange={onValueChange}
      >
        <Checkbox
          value="passkey"
          icon={KeyRoundIcon}
          label="Passkey"
          description="Face, fingerprint or screen lock."
        />
        <Checkbox
          value="totp"
          icon={SmartphoneIcon}
          label="Authenticator app"
          description="A 6-digit code from an app."
        />
        <Checkbox
          value="email"
          icon={MailIcon}
          label="Email link"
          description="A one-time link to their inbox."
        />
      </CheckboxGroup>,
    );
    await page.getByText("A 6-digit code from an app.").click({ force: true });
    expect(onValueChange).toHaveBeenLastCalledWith(["passkey", "totp"], expect.anything());
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(980, 420);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 940,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <AppTypes width={520} />
        <CheckboxGroup label="Sign-in methods" variant="tile" defaultValue={["passkey", "totp"]}>
          <Checkbox
            value="passkey"
            icon={KeyRoundIcon}
            label="Passkey"
            description="Face, fingerprint or screen lock."
          />
          <Checkbox
            value="totp"
            icon={SmartphoneIcon}
            label="Authenticator app"
            description="A 6-digit code from an app."
          />
          <Checkbox
            value="email"
            icon={MailIcon}
            label="Email link"
            description="A one-time link to their inbox."
          />
        </CheckboxGroup>
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Choice tiles", "[data-qx-stage]");
  });
});
