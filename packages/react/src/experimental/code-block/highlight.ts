/**
 * A small syntax highlighter for the code a product shows: shell commands, JavaScript and
 * TypeScript (with JSX), JSON, and XML or HTML. Ordered patterns per language, first match wins;
 * it colours what's useful to read, it doesn't parse. Six kinds, one for each code colour token.
 */

export type CodeLanguage =
  | "shell"
  | "javascript"
  | "typescript"
  | "tsx"
  | "json"
  | "xml"
  | "html"
  | "text";

export type TokenKind =
  | "keyword"
  | "string"
  | "number"
  | "literal"
  | "comment"
  | "punctuation"
  | "plain";

export interface Token {
  kind: TokenKind;
  text: string;
}

type Rules = [TokenKind, RegExp][];

const JS_KEYWORDS =
  "as|async|await|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|new|of|return|static|switch|this|throw|try|type|typeof|var|void|while|yield";

const SCRIPT: Rules = [
  ["comment", /\/\/.*|\/\*[\s\S]*?\*\//y],
  ["string", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y],
  ["keyword", new RegExp(`\\b(?:${JS_KEYWORDS})\\b`, "y")],
  ["literal", /\b(?:true|false|null|undefined|NaN|Infinity)\b/y],
  ["number", /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b/y],
  ["punctuation", /<\/|\/>|=>|[{}()[\];,.<>/=:?!&|+*%^~-]/y],
  ["plain", /[\w$]+|\s+|./y],
];

const RULES: Record<Exclude<CodeLanguage, "text">, Rules> = {
  shell: [
    ["comment", /#.*/y],
    ["string", /"(?:[^"\\]|\\.)*"|'[^']*'/y],
    ["literal", /--?[\w-]+/y],
    ["number", /\$\{?\w+\}?/y],
    ["punctuation", /\|\||&&|[|;&\\]/y],
    ["plain", /\s+|[^\s'"|;&\\]+/y],
  ],
  javascript: SCRIPT,
  typescript: SCRIPT,
  tsx: SCRIPT,
  json: [
    ["keyword", /"(?:[^"\\\n]|\\.)*"(?=\s*:)/y],
    ["string", /"(?:[^"\\\n]|\\.)*"/y],
    ["number", /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y],
    ["literal", /\b(?:true|false|null)\b/y],
    ["punctuation", /[{}[\]:,]/y],
    ["plain", /\s+|[^\s"{}[\]:,]+/y],
  ],
  xml: [
    ["comment", /<!--[\s\S]*?-->/y],
    ["punctuation", /<\/|<\?|<!|\/>|\?>|[<>=]/y],
    ["string", /"[^"]*"|'[^']*'/y],
    ["literal", /[\w:.-]+(?=\s*=)/y],
    ["plain", /\s+|[^<>"'=\s]+/y],
  ],
  html: [],
};
RULES.html = RULES.xml;

/** Tokens, line by line: a token running over several lines (a comment) is split at each one. */
export function highlight(code: string, language: CodeLanguage): Token[][] {
  const rules = language === "text" ? [] : RULES[language];
  const markup = language === "xml" || language === "html";
  const script = language === "javascript" || language === "typescript" || language === "tsx";
  const tokens: Token[] = [];
  let at = 0;
  let previous = "";
  // A shell line's first word, or the first after a pipe or ;, is the command.
  let command = true;
  while (at < code.length) {
    let kind: TokenKind = "plain";
    let text = code.charAt(at);
    for (const [ruleKind, rule] of rules) {
      rule.lastIndex = at;
      const match = rule.exec(code);
      if (match?.[0]) {
        kind = ruleKind;
        text = match[0];
        break;
      }
    }
    const word = /^[\w:.$-]+$/.test(text);
    // The name straight after "<" or "</" is a tag: an XML element, or a JSX component.
    if (kind === "plain" && word && (previous === "<" || previous === "</" || previous === "<?")) {
      if (markup) kind = "keyword";
      else if (script) kind = "literal";
    }
    if (language === "shell") {
      if (kind === "plain" && word && command) kind = "keyword";
      if (kind === "punctuation" || text.includes("\n")) command = true;
      else if (!/^\s+$/.test(text)) command = false;
    }
    tokens.push({ kind, text });
    if (!/^\s+$/.test(text)) previous = text;
    at += text.length;
  }

  const lines: Token[][] = [[]];
  for (const token of tokens) {
    token.text.split("\n").forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines.at(-1)?.push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
