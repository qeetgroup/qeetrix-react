/**
 * The default English strings (decision D-13). Components take overrides through their own props;
 * the provider and locale packs arrive with the first component that needs a translated string it
 * can't take as a prop.
 */
export const messages = {
  skipLink: { label: "Skip to main content" },
  spinner: { label: "Loading" },
  link: { external: "(opens in a new tab)" },
  field: { optional: "(optional)" },
  overlay: { close: "Close" },
  toast: { close: "Dismiss", region: "Notifications" },
} as const;
