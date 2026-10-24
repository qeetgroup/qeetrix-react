/**
 * @qeetrix/react — Qeetrix React components.
 *
 * Primitives, in increments (qeetrix-files/qeetrix-react/02-inventory.md):
 *   1. foundations: Box, Stack, Inline, Grid, Text, Heading, Separator, VisuallyHidden, SkipLink;
 *   2. actions: Button, IconButton, Link, Toggle, ToggleGroup, Spinner.
 * Client components (Button, Toggle) carry "use client"; the rest are server-safe.
 *
 * @packageDocumentation
 */
export * from "./box";
export * from "./button";
export * from "./grid";
export * from "./heading";
export * from "./inline";
export type { ControlSize, QeetrixIcon } from "./internal/control";
export type { RenderProp } from "./internal/render";
export type { Inset, Space, TextAlign } from "./internal/space";
export * from "./link";
export * from "./separator";
export * from "./skip-link";
export * from "./spinner";
export * from "./stack";
export * from "./text";
export * from "./toggle";
export * from "./visually-hidden";
