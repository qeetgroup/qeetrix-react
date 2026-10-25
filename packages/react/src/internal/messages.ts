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
    collapse: "Collapse navigation",
    expand: "Expand navigation",
    open: "Open navigation",
    navigation: "Navigation",
  },
  breadcrumb: { label: "Breadcrumb" },
  dataState: {
    errorTitle: "Couldn't load this",
    errorDescription: "Try again, or check your connection.",
    retry: "Try again",
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
