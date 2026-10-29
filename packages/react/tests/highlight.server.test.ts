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

describe("Kotlin and Swift", () => {
  const kinds = (code: string, language: "kotlin" | "swift", text: string) =>
    highlight(code, language)
      .flat()
      .filter((token: Token) => token.text === text)
      .map((token: Token) => token.kind);

  it("Kotlin: annotations, keywords, strings, Compose's hex colours and units", () => {
    const kotlin = [
      "// A Qeetrix button",
      "@Composable",
      "fun SignIn(onClick: () -> Unit) {",
      '  val label = """Sign in"""',
      "  Button(onClick, color = Color(0xFF6200EE), padding = 16.dp, alpha = 0.5f) { Text(label) }",
      "}",
      "data class User(val id: Long = 1L, val name: String? = null)",
    ].join("\n");
    expect(kinds(kotlin, "kotlin", "// A Qeetrix button")).toEqual(["comment"]);
    expect(kinds(kotlin, "kotlin", "@Composable")).toEqual(["keyword"]);
    expect(kinds(kotlin, "kotlin", "fun")).toEqual(["keyword"]);
    expect(kinds(kotlin, "kotlin", "val")).toEqual(["keyword", "keyword", "keyword"]);
    expect(kinds(kotlin, "kotlin", "data")).toEqual(["keyword"]);
    expect(kinds(kotlin, "kotlin", '"""Sign in"""')).toEqual(["string"]);
    expect(kinds(kotlin, "kotlin", "0xFF6200EE")).toEqual(["number"]);
    expect(kinds(kotlin, "kotlin", "16")).toEqual(["number"]);
    expect(kinds(kotlin, "kotlin", "0.5f")).toEqual(["number"]);
    expect(kinds(kotlin, "kotlin", "1L")).toEqual(["number"]);
    expect(kinds(kotlin, "kotlin", "null")).toEqual(["literal"]);
    expect(kinds(kotlin, "kotlin", "->")).toEqual(["punctuation"]);
    expect(kinds(kotlin, "kotlin", "dp")).toEqual(["plain"]);
  });

  it("Kotlin: a soft modifier is a keyword only before a declaration, and a backticked name is a name", () => {
    const kotlin =
      "open class Panel\nvar open by remember { mutableStateOf(false) }\nfun `is open when tapped`() {}";
    expect(kinds(kotlin, "kotlin", "open")).toEqual(["keyword", "plain"]);
    expect(kinds(kotlin, "kotlin", "`is open when tapped`")).toEqual(["plain"]);
    expect(kinds(kotlin, "kotlin", "by")).toEqual(["keyword"]);
    expect(kinds(kotlin, "kotlin", "false")).toEqual(["literal"]);
  });

  it("Swift: attributes, macros, keywords, strings, ranges and nil", () => {
    const swift = [
      "/* A Qeetrix button */",
      "struct SignIn: View {",
      "  @State private var open = false",
      '  let title = "Sign in \\(name)"',
      "  var body: some View { Button(title) { open.toggle() }.padding(16) }",
      "}",
      "#Preview { SignIn() }",
      "for i in 0..<3 where i != 1 { print(i ?? nil) }",
    ].join("\n");
    expect(kinds(swift, "swift", "/* A Qeetrix button */")).toEqual(["comment"]);
    expect(kinds(swift, "swift", "struct")).toEqual(["keyword"]);
    expect(kinds(swift, "swift", "@State")).toEqual(["keyword"]);
    expect(kinds(swift, "swift", "#Preview")).toEqual(["keyword"]);
    expect(kinds(swift, "swift", "some")).toEqual(["keyword"]);
    expect(kinds(swift, "swift", "open")).toEqual(["plain", "plain"]);
    expect(kinds(swift, "swift", '"Sign in \\(name)"')).toEqual(["string"]);
    expect(kinds(swift, "swift", "16")).toEqual(["number"]);
    expect(kinds(swift, "swift", "..<")).toEqual(["punctuation"]);
    expect(kinds(swift, "swift", "??")).toEqual(["punctuation"]);
    expect(kinds(swift, "swift", "nil")).toEqual(["literal"]);
    expect(kinds(swift, "swift", "false")).toEqual(["literal"]);
  });

  it("Swift: raw and multi-line strings, and open before a declaration", () => {
    const swift = 'open class Panel {}\nlet pattern = #"\\d+"#\nlet note = """\n  Two lines\n  """';
    expect(kinds(swift, "swift", "open")).toEqual(["keyword"]);
    expect(kinds(swift, "swift", '#"\\d+"#')).toEqual(["string"]);
    const lines = highlight(swift, "swift");
    expect(lines.at(-1)?.map((token) => token.kind)).toEqual(["string"]);
  });

  it("stays fast on text that never closes", () => {
    const start = performance.now();
    highlight(`"""${'a"'.repeat(20_000)}`, "kotlin");
    highlight(`#"${'a"'.repeat(20_000)}`, "swift");
    highlight(`0x${"f".repeat(20_000)}g`, "kotlin");
    expect(performance.now() - start).toBeLessThan(1000);
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
