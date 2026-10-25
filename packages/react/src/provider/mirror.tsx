import type { ComponentProps, ReactElement } from "react";
import type { QeetrixIcon } from "../internal/control";

const mirrored = new WeakMap<QeetrixIcon, QeetrixIcon>();

/**
 * An icon that points a reading direction, mirrored under `dir="rtl"`:
 * `<Button icon={mirrorInRtl(ArrowRightIcon)}>Continue</Button>` points forward in both directions.
 *
 * `@qeetrix/icons` draws arrows and chevrons in their physical orientation and never mirrors them
 * (its `docs/rtl.md`): whether one means forward or back is the call site's decision, made here,
 * once, per icon. Don't pass an icon that doesn't point, such as search, check or a clock. The same
 * icon always returns the same component, so calling this during render never remounts it.
 */
export function mirrorInRtl(Icon: QeetrixIcon): QeetrixIcon {
  const known = mirrored.get(Icon);
  if (known) return known;
  function Mirrored(props: ComponentProps<QeetrixIcon>): ReactElement {
    return <Icon {...props} data-qx-mirror="" />;
  }
  Mirrored.displayName = `mirrorInRtl(${Icon.displayName ?? Icon.name})`;
  mirrored.set(Icon, Mirrored);
  return Mirrored;
}
