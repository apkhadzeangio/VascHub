# VascHub — Agent A UI corrections

Date: 2026-10-29 (Asia/Tbilisi).
Branch: `fix/site-ui-v1`.
BASE_SHA: `01bf7cd20d9352fc2d665bcf46feb224cac140c7`.

## What changes

- Header and Footer resolve configured destinations consistently. The existing `/#resources` anchor is preserved; the explicit Clinical Library link still goes to `/library`. Unsafe, protected or unresolved destinations show an availability notice.
- Membership has a visible Georgian "მალე" badge. It does not pretend to offer working public authentication.
- Nested menu notices use shared ownership of the body scroll lock. Closing one notice keeps the menu locked; closing the menu restores the original overflow value. Focus restoration uses `preventScroll`.
- Opening state is exposed with `aria-expanded`. The menu closes on route changes and when switching to the desktop breakpoint, including an open child notice.
- Long Georgian navigation labels, Footer links, cards and narrow action rows can wrap without fixed-height clipping.
- Search keeps the existing GET contract and real published-post query. It trims submitted whitespace, provides the mobile search keyboard hint and ties keyboard instructions to the field. The instructions use an accessible hidden span, preserving existing visible-text layout checks.
- Repeated "ყველას ნახვა" links identify their section to assistive technology.

No collection, access rule, data/query function, Clinical Library implementation, dependency, shared UI component or shared test configuration was changed.

## Evidence and limits

1. Production homepage was inspected in the cloud browser at approximately 1363 × 936. The visual system and honest empty states were retained. Production received no writes.
2. Production search was exercised with a non-matching Georgian query through the public GET form. The real zero-results state was present.
3. The isolated local candidate passed typecheck and lint before the environment disconnected. Migrations ran on a dedicated PGlite PostgreSQL-wire instance (PostgreSQL 18.6 / PGlite 0.5.13), not PostgreSQL 16.
4. The first new empty-state browser test passed locally. A 390 px populated screenshot was produced during the next run. The environment became unavailable before that run's final results or screenshot review could be retrieved.
5. An earlier local run caught a test-only false positive from checking visually hidden instructions as visible text. The instructions were changed from a hidden paragraph to a hidden span.
6. The final test suite additionally uses authenticated test-only global updates, ensuring the existing Next cache-invalidation hooks run in the server. This last adjustment requires CI validation.
7. Production capture from the local browser encountered a certificate trust error. TLS verification was not disabled. Production mobile/768/1440 screenshots are not claimed as completed.

The final commit, PostgreSQL 16 CI results and available screenshot artifact are recorded in the Draft PR description. A green test result alone is not a completed visual review.

## Targeted tests and captures

`tests/e2e/site-ui/navigation.e2e.spec.ts` matches the existing Playwright discovery pattern. It requires a loopback app and a dedicated loopback test database; it refuses production hosts. Existing fixture helpers create and remove clearly labelled test-only articles. Header/Footer state is restored and the temporary administrator removed.

The ten tests cover honest empty states, populated layouts and keyboard focus at 390/768/1440 px, article/Library/posts/anchor navigation, invalid Footer links, external link semantics, nested scroll locks, Escape/button/backdrop closing, desktop resizing and real Georgian search results/empty states.

The suite writes screenshots under this report's `screenshots/` folder and copies the same PNGs to `test-results/homepage/site-ui/`, which the existing `browser-previews` artifact already collects. No workflow changes are needed.

Run on an isolated database after migrations:

```bash
pnpm typecheck
pnpm lint
pnpm test:e2e tests/e2e/site-ui/navigation.e2e.spec.ts --workers=1
```

The unchanged shared Playwright configuration uses port 3000. Local checking used a temporary runner outside the repository to select port 3101 and the installed local Chromium executable. No production DATABASE_URL was used.

## Scope

Modified:
- `src/Header/Component.client.tsx`
- `src/Header/Nav/index.tsx`
- `src/Footer/Component.tsx`
- `src/Homepage/Page.tsx`
- `src/Homepage/styles.css`
- `src/search/Component.tsx`

Added:
- `src/components/site-ui/Dialog.tsx`
- `src/components/site-ui/NavigationLink.ts`
- `tests/e2e/site-ui/navigation.e2e.spec.ts`
- this report and integration requests.

Exports and props are retained. Main, merge, deploy, production CMS and infrastructure are outside this change.

## CI correction

The first PostgreSQL 16 CI run passed typecheck, lint, integration checks, build, the existing browser suite and the three new viewport/focus checks. It stopped on the new archive navigation test, which incorrectly assumed the existing `/posts` page contains a `main` element. The test now verifies the actual heading and published article content in `#main-content`. The archive's English labels and missing page landmark are recorded as a separate integration request rather than changing an out-of-scope file.
