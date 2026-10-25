/**
 * Where the alphabetic baseline of an element's text sits, in viewport px: the line its first text
 * node ends on, so pass one-line text. The text node is wrapped for a moment in a span that ends
 * with a zero-size inline-block, which the browser sets on the baseline. The span is inline, so
 * this also works when the text sits directly in a flex container, where the text is an anonymous
 * item with the same baseline.
 */
export function baseline(element: Element | null | undefined): number {
  if (!element) throw new Error("baseline: no element");
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
  });
  const text = walker.nextNode();
  if (!text) throw new Error("baseline: no text");
  const wrap = document.createElement("span");
  const probe = document.createElement("span");
  probe.style.cssText =
    "display: inline-block; inline-size: 0; block-size: 0; vertical-align: baseline";
  text.parentNode?.replaceChild(wrap, text);
  wrap.append(text, probe);
  const y = probe.getBoundingClientRect().bottom;
  wrap.replaceWith(text);
  return y;
}
