/**
 * Every user-facing string in the library, in English (decision D-13). A string resolves from the
 * component's own `messages` prop, then QeetrixProvider, then these defaults. Locale packs
 * (src/locales/) are typed as the complete catalogue, so a missing key fails the typecheck.
 */
export const messages = {
  skipLink: { label: "Skip to main content" },
  spinner: { label: "Loading" },
  link: { external: "(opens in a new tab)" },
  field: { optional: "(optional)", help: "About {label}", helpPlain: "More information" },
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
  calendar: {
    previousMonth: "Previous month",
    nextMonth: "Next month",
    previousYear: "Previous year",
    nextYear: "Next year",
    previousYears: "Previous 10 years",
    nextYears: "Next 10 years",
    chooseYear: "{title}, choose year",
    today: "Today, {date}",
    rangeStart: "Starts {date}. Now choose the end date.",
    rangeSelected: "{start} to {end}",
  },
  datePicker: {
    choose: "Choose date",
    example: "e.g. {date}",
    invalid: "Enter a date like {date}",
    tooEarly: "Choose {date} or later",
    tooLate: "Choose {date} or earlier",
    unavailable: "{date} isn't available",
  },
  table: {
    selectAll: "Select all rows",
    selectRow: "Select {row}",
    actions: "Actions",
    rowActions: "Actions for {row}",
    selected: "{count} selected",
    clear: "Clear selection",
    loading: "Loading",
    empty: "No results",
  },
  commandPalette: {
    label: "Search or jump to",
    placeholder: "Search or jump to…",
    empty: "No results for “{query}”",
    loading: "Searching…",
    move: "to move",
    open: "to open",
    close: "to close",
  },
  codeBlock: { copy: "Copy code", region: "Code", shell: "Shell" },
  descriptionList: { empty: "Not set" },
  filterTags: { label: "Applied filters", remove: "Remove filter {filter}", clear: "Clear all" },
  fileUpload: {
    dragFile: "Drag a file here, or {browse}",
    dragFiles: "Drag files here, or {browse}",
    browse: "browse",
    drop: "Drop to upload",
    hint: "{types}, up to {size}",
    hintSize: "Up to {size}",
    uploading: "Uploading {name}",
    uploaded: "Uploaded",
    failed: "Not uploaded",
    remove: "Remove {name}",
    wrongType: "Only {types} files can be used here",
    notAllowed: "This kind of file can't be used here",
    tooBig: "Larger than {size}",
    tooMany: "Choose one file at a time",
  },
  steps: { label: "Progress", done: "Completed", upcoming: "Not started" },
  searchField: { clear: "Clear search" },
  dateRangePicker: {
    choose: "Choose dates",
    example: "e.g. {range}",
    invalid: "Enter dates like {range}",
    tooEarly: "Choose {date} or later",
    tooLate: "Choose {date} or earlier",
    unavailable: "{date} isn't available",
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
