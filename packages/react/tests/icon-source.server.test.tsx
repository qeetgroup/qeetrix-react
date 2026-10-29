/**
 * Icon props take a component or an element (QTRX-90). A Server Component can't pass a function to
 * a client component, so it passes `<PlusIcon />`; React renders that on the server and the client
 * component receives the `<svg>` it drew. Calling an icon as a function gives that same `<svg>`.
 */
import { FingerprintPatternIcon } from "@qeetrix/icons/icons/fingerprint-pattern";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Badge,
  Button,
  IconButton,
  type IconSource,
  Input,
  Tab,
  Tabs,
  TabsList,
  Toggle,
} from "../src/index";

const html = (node: React.ReactElement) => renderToString(node);
/** The `<svg>` a Server Component's `<FingerprintPatternIcon … />` arrives as. */
const fromServer = (props: Parameters<typeof FingerprintPatternIcon>[0] = {}) =>
  FingerprintPatternIcon(props);
const svg = (out: string) => out.match(/<svg[^>]*>/)?.[0] ?? "";

describe("an icon prop", () => {
  it("draws a component and an element the same: sharp, at the control's size, hidden", () => {
    const component = html(<Button icon={FingerprintPatternIcon}>Sign in</Button>);
    const element = html(<Button icon={<FingerprintPatternIcon />}>Sign in</Button>);
    expect(element).toBe(component);
    expect(svg(element)).toContain('width="16"');
    expect(svg(element)).toContain('aria-hidden="true"');
    expect(svg(element)).toContain('stroke-linecap="square"');
    expect(svg(element)).toContain('class="qx-button-icon"');
  });

  it("keeps an element's own props, such as data-qx-mirror, under Qeetrix's size and class", () => {
    const out = html(
      <IconButton
        icon={<FingerprintPatternIcon data-qx-mirror="" className="mine" size={40} />}
        aria-label="Passkeys"
      />,
    );
    expect(svg(out)).toContain("data-qx-mirror");
    expect(svg(out)).toContain('class="mine qx-button-icon"');
    expect(svg(out)).toContain('width="16"');
  });

  it("sizes, hides and classes the <svg> a Server Component sends, keeping its drawing", () => {
    for (const out of [
      html(<Button icon={fromServer({ shape: "sharp" })}>Sign in</Button>),
      html(<Badge icon={fromServer({ shape: "sharp" })}>Passkeys</Badge>),
      html(<Input icon={fromServer({ shape: "sharp" })} aria-label="Search" />),
    ]) {
      expect(svg(out)).not.toContain('width="24"');
      expect(svg(out)).toContain('aria-hidden="true"');
      expect(svg(out)).toContain('stroke-linecap="square"');
      expect(svg(out)).toMatch(/class="qx-(button|badge|input)-icon"/);
    }
    // Drawn on the server without shape="sharp", it stays round: Qeetrix can't redraw it.
    expect(svg(html(<Button icon={fromServer()}>Sign in</Button>))).toContain(
      'stroke-linecap="round"',
    );
  });

  it("swaps to a filled drawing only when it has the component, so a server <svg> stays outline", () => {
    const component = html(
      <Toggle icon={FingerprintPatternIcon} filledWhenPressed aria-label="Passkeys" />,
    );
    const server = html(
      <Toggle icon={fromServer({ shape: "sharp" })} filledWhenPressed aria-label="Passkeys" />,
    );
    expect(component).toContain("qx-toggle-icon-filled");
    expect(server).not.toContain("qx-toggle-icon-filled");
    expect(server).toContain("qx-toggle-icon-outline");

    const tabs = (icon: IconSource) =>
      html(
        <Tabs defaultValue="a">
          <TabsList>
            <Tab value="a" icon={icon} filledWhenSelected>
              Passkeys
            </Tab>
          </TabsList>
        </Tabs>,
      );
    expect(tabs(<FingerprintPatternIcon />)).toContain("qx-tab-icon-filled");
    expect(tabs(fromServer({ shape: "sharp" }))).not.toContain("qx-tab-icon-filled");
  });
});
