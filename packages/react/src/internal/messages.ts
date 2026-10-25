/**
 * Every user-facing string in the library, in English (decision D-13). A string resolves from the
 * component's own `messages` prop, then QeetrixProvider, then these defaults. Locale packs
 * (src/locales/) are typed as the complete catalogue, so a missing key fails the typecheck.
 */
export const messages = {
  skipLink: { label: "Skip to main content" },
  spinner: { label: "Loading" },
  link: { external: "(opens in a new tab)" },
  field: { optional: "(optional)" },
  overlay: { close: "Close" },
  toast: { close: "Dismiss", region: "Notifications" },
  slider: { minimum: "Minimum", maximum: "Maximum" },
  appShell: {
    collapse: "Collapse",
    expand: "Expand",
    open: "Open navigation",
    navigation: "Navigation",
    tools: "Tools",
    closePanel: "Close panel",
  },
  sidebar: { filter: "Filter navigation", noMatches: "No pages match" },
  breadcrumb: { label: "Breadcrumb" },
  dataState: {
    errorTitle: "Couldn't load this",
    errorDescription: "Try again, or check your connection.",
    retry: "Try again",
  },
  copyButton: { copy: "Copy", copied: "Copied", failed: "Couldn't copy" },
  alert: {
    dismiss: "Dismiss",
    info: "Information",
    success: "Success",
    warning: "Warning",
    danger: "Error",
  },
  passwordInput: {
    show: "Show password",
    shown: "Password shown",
    hidden: "Password hidden",
    capsLock: "Caps Lock is on",
  },
  otpInput: { character: "Character {index} of {length}" },
  numberField: { increment: "Increase", decrement: "Decrease", roleDescription: "Number field" },
  pagination: {
    label: "Pagination",
    first: "First page",
    previous: "Previous page",
    next: "Next page",
    last: "Last page",
    range: "{start}–{end} of {total}",
    rangeOpen: "{start}–{end}",
    rowsPerPage: "Rows per page",
  },
  errorSummary: { title: "Fix these to continue" },
  combobox: {
    empty: "No matches",
    clear: "Clear",
    open: "Show options",
    remove: "Remove {label}",
    removeHint: "Press Backspace or Delete to remove",
    selected: "{count} selected. From the start of the field, use the arrow keys to reach them.",
  },
} as const;

/** The complete catalogue, as a locale pack provides it. */
export type QeetrixMessages = {
  [Group in keyof typeof messages]: { [Key in keyof (typeof messages)[Group]]: string };
};

/** Any subset of the catalogue, group by group: what a provider or a component takes. */
export type QeetrixMessagesInput = {
  [Group in keyof QeetrixMessages]?: Partial<QeetrixMessages[Group]>;
};

/** The default locale: English with Indian number grouping (lakh, crore). */
export const DEFAULT_LOCALE = "en-IN";
