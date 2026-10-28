/**
 * The form controls on the server: each renders its label wiring, roles and states into the HTML,
 * so a form is usable before hydration. And each family's own stylesheet brings everything it
 * renders, so `@qeetrix/react/css/checkbox.css` works without the full stylesheet.
 */
import { existsSync, readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Checkbox,
  CheckboxGroup,
  Field,
  Fieldset,
  Input,
  Radio,
  RadioGroup,
  Switch,
  Textarea,
  TextField,
} from "../src/index";

const html = (node: React.ReactElement) => renderToString(node);

describe("form controls render on the server", () => {
  it("Field links its label to the control and marks optional fields", () => {
    const out = html(
      <Field label="Trade name" optional>
        <Input />
      </Field>,
    );
    const id = out.match(/<input[^>]* id="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(out).toContain(`for="${id}"`);
    expect(out).toContain("(optional)");
  });

  it("TextField renders a server error, invalid, with its icon", () => {
    const out = html(<TextField label="PAN" error="This PAN is already registered." />);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain("This PAN is already registered.");
    expect(out).toContain('class="qx-field-error-icon"');
  });

  it("an error replaces the description in the HTML too, so the error alone describes the input", () => {
    const out = html(
      <TextField label="PAN" description="Letters, then digits." error="PAN has 10 characters." />,
    );
    expect(out).not.toContain("Letters, then digits.");
    expect(out).not.toContain("field-description");
    expect(out).toContain("PAN has 10 characters.");
  });

  it("Textarea carries its rows", () => {
    const out = html(<Textarea aria-label="Notes" rows={4} maxRows={8} />);
    expect(out).toMatch(/^<textarea/);
    expect(out).toContain('rows="4"');
    expect(out).toContain("--qx-textarea-max-rows:8");
  });

  it("Checkbox, Radio and Switch carry their roles and states", () => {
    expect(html(<Checkbox label="GST" defaultChecked />)).toMatch(
      /role="checkbox"[^>]* aria-checked="true"/,
    );
    const alone = html(<Checkbox aria-label="Select row" />);
    expect(alone).not.toContain("<label");
    expect(alone).toContain('aria-label="Select row"');
    expect(html(<Switch label="Auto-renew" />)).toContain('role="switch"');
    const group = html(
      <RadioGroup label="Billing cycle" defaultValue="monthly">
        <Radio value="monthly" label="Monthly" />
      </RadioGroup>,
    );
    expect(group).toContain('role="radiogroup"');
    expect(group).toContain("Billing cycle");
    expect(
      html(
        <CheckboxGroup label="Notify me by">
          <Checkbox value="email" label="Email" />
        </CheckboxGroup>,
      ),
    ).toContain('role="group"');
  });

  it("Fieldset is a native fieldset", () => {
    expect(html(<Fieldset legend="Billing address" />)).toMatch(/^<fieldset/);
  });

  it("Fieldset is described by its description", () => {
    const out = html(<Fieldset legend="Billing address" description="Where invoices are sent." />);
    const id = out.match(/<p id="([^"]+)"[^>]*data-slot="fieldset-description"/)?.[1];
    expect(id).toBeTruthy();
    expect(out).toMatch(new RegExp(`^<fieldset[^>]* aria-describedby="${id}"`));
  });
});

describe("per-family stylesheets", () => {
  const css = (family: string) => {
    const file = new URL(`../dist/css/${family}.css`, import.meta.url);
    if (!existsSync(file)) throw new Error("dist/ is missing: run `bun run build` first");
    return readFileSync(file, "utf8");
  };
  const imports = (family: string) =>
    [...css(family).matchAll(/@import "\.\/([a-z-]+)\.css";/g)].map((m) => m[1]);

  it("import the base and state layers and every family they render", () => {
    expect(imports("button")).toEqual(["base", "state", "spinner", "tooltip"]);
    expect(imports("checkbox")).toEqual(["base", "state", "field"]);
    expect(imports("text-field")).toEqual(["base", "state", "field", "input"]);
    expect(imports("stack")).toEqual(["base", "state"]);
  });

  it("declare the layer order first, so qx.state follows the components when used alone", () => {
    expect(css("button").startsWith("@layer qx.base, qx.components, qx.state;\n")).toBe(true);
  });
});
