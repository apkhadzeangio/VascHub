# Upstream provenance

- Source: https://github.com/payloadcms/payload/tree/v3.92.1/templates/website
- Release: **v3.92.1**, published 2026-10-27; verified 2026-10-28.
- Resolved upstream commit: **9c396345dad3c831a34fd212299532e03dc4818f**.
- Template path: `templates/website`.
- Original MIT copyright/license retained in `LICENSE.md`.
- All Payload packages pinned to `3.92.1`; Next.js `16.3.3`, React `19.2.6`.
- pnpm `11.25.0`, resolved dependencies tracked in `pnpm-lock.yaml`.

Adaptations: PostgreSQL adapter + committed initial migration; explicit migrations
in development and production; Node 24 Docker setup; server-only first admin bootstrap;
Georgian starter copy; VascHub wordmark; demo seed endpoint disabled; runtime CMS
rendering so Docker builds need no database; ESLint flat-config compatibility and
small upstream React compatibility corrections; access-control and browser tests.

The starter's public homepage is a fallback until editors create a published `home`
page. It does not fabricate completed clinical modules. Unused upstream demo seed content and stock images were removed. The demo seed
endpoint returns 403; media uploads and all CMS editing components are retained.
The favicon is a minimal VascHub placeholder; social preview artwork is pending Figma design.

No proprietary WordPress or Base44 dependency is required. Figma remains a design
tool; implementation and project documentation are versioned in this repository.
