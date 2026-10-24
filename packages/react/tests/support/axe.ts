import axe from "axe-core";

/**
 * Run axe on a rendered element and fail with a readable list of violations. Every WCAG 2.x A and
 * AA rule is on, colour contrast included: the design rules guarantee AA, so a contrast failure is
 * a real defect, not noise to silence.
 */
export async function expectAccessible(element: Element): Promise<void> {
  const result = await axe.run(element, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  });
  if (result.violations.length > 0) {
    const lines = result.violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
    throw new Error(`axe found ${result.violations.length} violation(s):\n${lines.join("\n")}`);
  }
}
