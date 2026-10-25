import axe from "axe-core";
import { settled } from "./settled";

/**
 * Run axe on a rendered element and fail with a readable list of violations. Every WCAG 2.x A and
 * AA rule is on, colour contrast included: the design rules guarantee AA, so a contrast failure is
 * a real defect, not noise to silence. It waits for transitions first: contrast mid-fade isn't real.
 */
export async function expectAccessible(element: Element): Promise<void> {
  await settled();
  // Base UI's focus guards are aria-hidden on purpose: they pass focus on the moment it lands, so
  // nothing ever rests on them. axe can't know that.
  const result = await axe.run(
    { include: [element], exclude: [["[data-base-ui-focus-guard]"]] },
    {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    },
  );
  if (result.violations.length > 0) {
    const lines = result.violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
    throw new Error(`axe found ${result.violations.length} violation(s):\n${lines.join("\n")}`);
  }
}
