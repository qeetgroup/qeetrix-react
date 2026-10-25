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
  appShell: {
    collapse: "छोटा करें",
    expand: "बड़ा करें",
    open: "नेविगेशन खोलें",
    navigation: "नेविगेशन",
    tools: "टूल",
    closePanel: "पैनल बंद करें",
  },
  sidebar: { filter: "नेविगेशन में खोजें", noMatches: "कोई पेज नहीं मिला" },
  breadcrumb: { label: "पेज का पथ" },
  dataState: {
    errorTitle: "यह लोड नहीं हो सका",
    errorDescription: "फिर से कोशिश करें, या अपना कनेक्शन जाँचें।",
    retry: "फिर से कोशिश करें",
  },
  copyButton: { copy: "कॉपी करें", copied: "कॉपी हो गया", failed: "कॉपी नहीं हो सका" },
  alert: {
    dismiss: "खारिज करें",
    info: "जानकारी",
    success: "सफल",
    warning: "चेतावनी",
    danger: "त्रुटि",
  },
  passwordInput: {
    show: "पासवर्ड दिखाएँ",
    shown: "पासवर्ड दिख रहा है",
    hidden: "पासवर्ड छिपा है",
    capsLock: "कैप्स लॉक चालू है",
  },
  otpInput: { character: "{length} में से अक्षर {index}" },
  numberField: { increment: "बढ़ाएँ", decrement: "घटाएँ", roleDescription: "संख्या फ़ील्ड" },
  combobox: {
    empty: "कोई मिलान नहीं",
    clear: "साफ़ करें",
    open: "विकल्प दिखाएँ",
    remove: "{label} हटाएँ",
    removeHint: "हटाने के लिए Backspace या Delete दबाएँ",
    selected: "{count} चुने गए। फ़ील्ड की शुरुआत से, उन तक पहुँचने के लिए तीर कुंजियों का उपयोग करें।",
  },
};
