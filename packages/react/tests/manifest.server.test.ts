import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
// @ts-expect-error: a plain script, without declarations
import { families } from "../scripts/build-manifest.mjs";
import { manifest } from "../src/manifest";

interface Found {
  name: string;
  status: string;
  kind: string;
  entry: string;
  parts: string[];
}

describe("@qeetrix/react/manifest", () => {
  it("lists every family with its status, entry point and parts (run `bun run manifest`)", () => {
    const found = (families() as (Found & { dir: string })[]).map(
      ({ dir: _, ...family }) => family,
    );
    expect(manifest.map(({ since: _, ...family }) => family)).toEqual(found);
  });

  it("dates every family to a released version or this one, and points stable ones at their entry", () => {
    for (const family of manifest) {
      expect(family.since).toMatch(/^\d+\.\d+\.\d+$/);
      if (family.status === "stable") {
        expect(Object.keys(pkg.exports)).toContain(`./${family.name}`);
      }
    }
    expect(manifest.find((family) => family.name === "tabs")?.parts).toEqual(
      expect.arrayContaining(["Tabs", "TabsList", "Tab", "TabsPanel"]),
    );
  });
});
