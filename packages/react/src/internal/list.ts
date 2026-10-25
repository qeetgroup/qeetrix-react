import { isValidElement } from "react";
import type { RenderProp } from "./render";

/**
 * `role="list"` when a layout primitive renders a list (`render={<ul />}`). Its stylesheet drops the
 * list's bullets and indent, and Safari stops exposing a list without bullets as a list unless the
 * role is explicit. A `role` on the render element, or on the component, still wins.
 */
export function listRole(render: RenderProp | undefined): { role?: "list" } {
  return isValidElement(render) && (render.type === "ul" || render.type === "ol")
    ? { role: "list" }
    : {};
}
