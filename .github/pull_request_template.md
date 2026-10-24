## What and why

<!-- What changes, and the reason. Link the product request or issue. -->

## Version

<!-- version.yml bumps the patch. While 0.x: a new primitive, prop or output is a patch; removing or
renaming an export, prop, variant, slot or CSS class, or changing what one means, is a minor — raise
it in packages/react/package.json by hand. A changed API report needs a raised version. -->

- [ ] `CHANGELOG.md` has a section for the new version, written for the person upgrading

## Checklist

- [ ] `bun run build && bun run typecheck && bun run lint && bun run test && bun run check:package`
- [ ] The component meets every item of the Definition of Done (qeetrix-files/qeetrix-react/01-charter.md §7)
- [ ] It follows the design rules and its spec (05-design-rules.md, 06-component-specs.md)
- [ ] Screenshot changes on Argos are intended and approved

<!-- Stop and escalate instead of merging if this removes or renames a public export, prop, variant,
slot or class; weakens an accessibility guarantee; adds a runtime dependency or a package; or needs a
change in another repository. -->
