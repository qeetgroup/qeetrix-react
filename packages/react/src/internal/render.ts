import { cloneElement, createElement, isValidElement, type ReactElement } from "react";
import { cx } from "./cx";

/**
 * An element to render instead of a component's default one: `render={<section />}`. It receives the
 * component's props; its own props win, and class names and styles merge (decision D-12).
 */
export type RenderProp = ReactElement<Record<string, unknown>>;

type Props = Record<string, unknown> & {
  className?: string | undefined;
  style?: object | undefined;
};

/**
 * Render `tag`, or the `render` element with the props merged in. Built on cloneElement rather than a
 * hook, so server-safe primitives stay server-safe.
 */
export function renderElement(
  tag: string,
  render: RenderProp | undefined,
  props: Props,
): ReactElement {
  if (render === undefined || !isValidElement(render)) return createElement(tag, props);
  const own = render.props as Props;
  return cloneElement(render, {
    ...props,
    ...own,
    className: cx(props.className, own.className),
    style: props.style || own.style ? { ...props.style, ...own.style } : undefined,
    children: own.children ?? props.children,
  });
}
