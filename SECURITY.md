# Security

## Reporting a vulnerability

Report it **privately**: through GitHub's private vulnerability reporting (the repository's
**Security** tab → **Report a vulnerability**), or directly to a repository administrator. Do not
describe it in an issue or a pull request.

Include the affected version, the component or file involved, and what an attacker could do with it.

## Scope

`@qeetrix/react` renders UI inside every Qeet product, so the realistic risks are:

- **Untrusted props.** Components never use `dangerouslySetInnerHTML`, and never build CSS or URLs
  from unchecked props. Text props are rendered as text.
- **The release path.** Publishing runs only from `.github/workflows/release.yml` on `main`, in the
  `npm-publish` environment with a required reviewer, through npm trusted publishing (no long-lived
  token), with provenance. Actions are pinned to commit SHAs.
- **The supply chain.** Runtime dependencies are limited to Base UI, React and Qeetrix packages
  (peers). Development dependencies come from a frozen lockfile and are updated by Dependabot with a
  three-day cooldown.

## Supported versions

Only the latest published version receives fixes while the package is `0.x`.
