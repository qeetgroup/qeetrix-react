import { server, userEvent } from "vitest/browser";

/**
 * Tab to the next focusable element. WebKit, like Safari's default setting, tabs only to form fields
 * and elements with a tabindex; Option+Tab reaches links and native buttons too.
 */
export function tab(): Promise<void> {
  return userEvent.keyboard(server.browser === "webkit" ? "{Alt>}{Tab}{/Alt}" : "{Tab}");
}
