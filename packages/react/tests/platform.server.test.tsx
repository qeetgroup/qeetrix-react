import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Probe } from "./fixtures/probe";

describe("platform: server", () => {
  it("renders on the server with no browser APIs", () => {
    expect(renderToString(<Probe />)).toBe(
      '<button type="button" class="qx-probe" data-slot="probe">Save changes</button>',
    );
  });
});
