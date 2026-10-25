import type { QeetrixMessages } from "../internal/messages";

/**
 * Hindi. The words match Qeet ID's own Hindi strings ("खारिज करें" for Dismiss, "लोड हो रहा है" for
 * Loading), so a product and the library never disagree.
 *
 * `<QeetrixProvider locale="hi-IN" messages={hi}>`
 */
export const hi: QeetrixMessages = {
  skipLink: { label: "मुख्य सामग्री पर जाएँ" },
  spinner: { label: "लोड हो रहा है" },
  link: { external: "(नए टैब में खुलता है)" },
  field: { optional: "(वैकल्पिक)" },
  overlay: { close: "बंद करें" },
  toast: { close: "खारिज करें", region: "सूचनाएँ" },
  slider: { minimum: "न्यूनतम", maximum: "अधिकतम" },
};
