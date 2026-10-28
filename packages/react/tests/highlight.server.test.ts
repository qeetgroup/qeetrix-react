/**
 * CodeBlock's highlighter: each language's tokens, in the six kinds the code colour tokens cover,
 * split line by line.
 */
import { describe, expect, it } from "vitest";
import { highlight, type Token } from "../src/experimental/code-block/highlight";

/** The coloured tokens of every line, as "kind:text". */
const marked = (lines: Token[][]) =>
  lines
    .flat()
    .filter((token) => token.kind !== "plain")
    .map((token) => `${token.kind}:${token.text}`);

describe("highlight", () => {
  it("JSON: keys, strings, numbers, literals and punctuation", () => {
    expect(
      marked(highlight('{ "risk": 0.12, "mfa": true, "who": "usr_1", "device": null }', "json")),
    ).toEqual([
      "punctuation:{",
      'keyword:"risk"',
      "punctuation::",
      "number:0.12",
      "punctuation:,",
      'keyword:"mfa"',
      "punctuation::",
      "literal:true",
      "punctuation:,",
      'keyword:"who"',
      "punctuation::",
      'string:"usr_1"',
      "punctuation:,",
      'keyword:"device"',
      "punctuation::",
      "literal:null",
      "punctuation:}",
    ]);
  });

  it("TSX: keywords, strings, comments, numbers, and JSX components", () => {
    const tokens = marked(
      highlight(
        '// Sign-in\nimport { A } from "@qeetid/react";\n<QeetIdProvider minutes={60} />',
        "tsx",
      ),
    );
    expect(tokens).toContain("comment:// Sign-in");
    expect(tokens).toContain("keyword:import");
    expect(tokens).toContain("keyword:from");
    expect(tokens).toContain('string:"@qeetid/react"');
    expect(tokens).toContain("literal:QeetIdProvider");
    expect(tokens).toContain("number:60");
  });

  it("XML: tags, attributes, strings and comments", () => {
    const tokens = marked(
      highlight('<!-- IdP -->\n<EntityDescriptor entityID="https://acme">', "xml"),
    );
    expect(tokens).toEqual([
      "comment:<!-- IdP -->",
      "punctuation:<",
      "keyword:EntityDescriptor",
      "literal:entityID",
      "punctuation:=",
      'string:"https://acme"',
      "punctuation:>",
    ]);
  });

  it("shell: the command, flags, strings, variables and comments", () => {
    const tokens = marked(
      highlight('bun add @qeetid/react --exact # pin it\nexport QEET_ID="$TOKEN"', "shell"),
    );
    expect(tokens).toEqual([
      "keyword:bun",
      "literal:--exact",
      "comment:# pin it",
      "keyword:export",
      'string:"$TOKEN"',
    ]);
  });

  it("splits tokens that run over lines, and leaves text uncoloured", () => {
    const lines = highlight("/* one\ntwo */ x", "javascript");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual([{ kind: "comment", text: "/* one" }]);
    expect(lines[1]?.[0]).toEqual({ kind: "comment", text: "two */" });
    expect(highlight("plain words", "text")).toEqual([
      [...Array.from("plain words").map((text) => ({ kind: "plain", text }))],
    ]);
  });
});

describe("CSS", () => {
  it("colours at-rules and properties as keywords, custom properties and hex as literals", () => {
    const css =
      "@layer qx.components {\n  .qx-tag { color: var(--qx-color-text-brand); inline-size: 12px; /* note */ }\n}";
    const kinds = (text: string) =>
      highlight(css, "css")
        .flat()
        .filter((token: Token) => token.text === text)
        .map((token: Token) => token.kind);
    expect(kinds("@layer")).toEqual(["keyword"]);
    expect(kinds("color")).toEqual(["keyword"]);
    expect(kinds("inline-size")).toEqual(["keyword"]);
    expect(kinds("--qx-color-text-brand")).toEqual(["literal"]);
    expect(kinds("12px")).toEqual(["number"]);
    expect(kinds("/* note */")).toEqual(["comment"]);
  });
});

describe("highlightHtml", () => {
  it("is escaped HTML in the code colours, for a page without React", async () => {
    const { highlightHtml } = await import("../src/experimental/code-block/highlight");
    const out = highlightHtml('<a href="#">x</a>\n', "html");
    expect(out).toContain(
      '<span data-token="punctuation" style="color:var(--qx-color-code-punctuation)">&lt;</span>',
    );
    expect(out).toContain(
      '<span data-token="string" style="color:var(--qx-color-code-string)">&quot;#&quot;</span>',
    );
    expect(out.endsWith("\n")).toBe(false);
  });
});
