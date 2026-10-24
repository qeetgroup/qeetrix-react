import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Probe } from "./fixtures/probe";

describe("platform: server", () => {
  it("renders on the server with no browser APIs", () => {
    const html = renderToString(<Probe />);
    expect(html).toMatch(
      /^<button type="button" class="qx-probe" data-slot="probe" style="[^"]+">Save changes<\/button>$/,
    );
    expect(html).toContain("height:var(--qx-size-control-md)");
  });
});
