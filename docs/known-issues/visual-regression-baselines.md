# Resolved (test-infra) — visual regression needs a pinned environment, and caught a real theme race

**Status:** implemented 2026-07-21 · **Severity:** test-infra design decision, surfaced one real product-adjacent bug · **Filed:** 2026-07-21

## The environment problem

`e2e/tests/visual.spec.ts` (`toHaveScreenshot`) pixel-compares full-page
screenshots against committed baseline PNGs. Font rendering, subpixel AA, and
system font packages differ across OS versions and even across otherwise
identical `ubuntu-latest` runs months apart as Ubuntu's live package mirrors
drift — so a baseline captured on a dev laptop, or even on a bare
`ubuntu-latest` runner with browsers installed fresh via
`playwright install --with-deps`, degrades into intermittent unrelated diffs
over time. That's a maintenance trap, not a one-time flake.

The fix: run the **whole E2E stage** of CI inside
`mcr.microsoft.com/playwright:v1.60.0-noble` — the official image pinned to
the exact `@playwright/test` version this repo uses, on the same Ubuntu base
(`noble` = 24.04) as `ubuntu-latest`. Baselines are captured inside that same
image (see the CI step) and only ever compared inside it, so the environment
that produced them never drifts out from under them. This also means
`playwright install --with-deps` is gone from CI — the image ships Chromium
and WebKit preinstalled.

`supabase start` (needs the runner's own Docker daemon) and `pnpm build`
stay directly on the runner as before — only the Playwright *test execution*
moves into the container, via `docker run --network host` so it reaches the
runner's `localhost` Supabase/Next servers transparently, with
`$GITHUB_WORKSPACE` bind-mounted in and env forwarded through an explicit
`--env-file` (Docker does not inherit the host shell's env by default).

**Local-repro gotcha, not a CI-only concern:** the container mounts the real
working tree, and `pnpm install` inside it will happily overwrite `node_modules`
with Linux binaries if you bind-mount your actual macOS/Windows checkout —
breaks the host install until you `pnpm install` again on the host. Rehearse
against an isolated `rsync --exclude node_modules` copy, never the live repo,
if reproducing this locally.

## The real bug it caught before it ever reached a baseline

While first capturing the baselines, `homepage-dark` on WebKit rendered as a
~97%-different, unmistakably **light**-themed page despite the test setting
`localStorage.setItem("theme", "dark")` before navigating. Chromium never
reproduced it; WebKit did, intermittently — sometimes the correct dark
render, sometimes the wrong light one, across otherwise-identical runs.

Root cause: `page.addInitScript(...)` (setting `localStorage`) and
next-themes' own blocking no-flash script are two independently-scheduled
early-document scripts. Nothing guarantees which runs first — Chromium's
ordering happened to always favor the test's script in testing, WebKit's
didn't. This is the same *category* of bug as
`hydration-double-render.md` and `webkit-save-stall.md` (a real timing race
exposed right at first paint/navigation, WebKit losing it more often than
Chromium) — a third instance of it, not a new class of problem.

**The fix** (`e2e/tests/theme-helper.ts`): don't trust script-registration
order. After `setTheme` + `page.goto`, `waitForTheme` polls
`document.documentElement.classList` for the resolved theme before any
theme-sensitive assertion runs — a screenshot in `visual.spec.ts`, or an axe
scan in `a11y.spec.ts` (same race could have silently scanned the wrong
theme's contrast there too; both specs now share this helper). Verified
stable across repeated runs (`--repeat-each=3`, twice) after the fix, vs.
reproducing within the first few runs before it.

## Scope

Deliberately 2 pages (marketing homepage, dashboard) × 2 themes — enough to
catch an accidental full-page style regression (a token change that breaks a
whole surface, a CSS reset, a bad layout shift), not a pixel-lock on every
component. `reducedMotion: "reduce"` context option is load-bearing: Reveal/
RevealOnView (`components/motion.tsx`) are Framer Motion, driven by
`requestAnimationFrame`, not CSS — Playwright's own `animations: "disabled"`
only freezes CSS animations/transitions and cannot make a Framer mount-fade
deterministic. Forcing reduced-motion makes those components skip the
animation via their existing `useReducedMotion()` branch, which is both
deterministic and doubles as coverage that the reduced-motion path renders
correctly. `expect.toHaveScreenshot.maxDiffPixelRatio: 0.01` (playwright.config)
absorbs harmless sub-pixel AA noise without hiding a real visual change.

## Lessons / follow-ups

- **First real CI run timed out.** The pinned-container E2E step ran 26+
  minutes and got cancelled at the 30-minute job ceiling. Cause: the docker
  command included a `pnpm install --frozen-lockfile` inside the container
  "to be safe" — but the runner (`ubuntu-latest`) and the pinned image are
  the same OS/arch (linux-x64 Noble) by design, and the "Install dependencies"
  step earlier in the same job had already populated `node_modules` there.
  The container step was re-downloading ~700 packages from the network with
  zero cache on every single run. Removed — the container only needs
  `corepack enable && corepack prepare pnpm@11.6.0 --activate` to get a
  working `pnpm` binary against the already-installed, bind-mounted
  `node_modules`. Job timeout also padded 30 -> 45 min as margin, since a
  2-core shared runner's E2E time still has real run-to-run variance even
  without the redundant install. Local rehearsal of this exact pattern
  (macOS host, Linux container) couldn't fully validate the fix — cross-OS
  install IS genuinely required there, unlike real CI's same-OS case — so
  this specific fix could only be confirmed by watching an actual CI run.
- A residual, much smaller-scale WebKit flake surfaced under heavy parallel
  load (`--repeat-each=3` with 5 workers) after the theme race was fixed —
  no longer a wrong-render, just occasional slow settling. Same category as
  `webkit-save-stall.md`'s own diagnosis (WebKit is CPU-bound and loses
  timing races under concurrent load); CI's existing `retries: 2` covers it,
  consistent with how the rest of this suite tolerates that class of flake.
- If a future visual-regression page is data-driven (unlike the two here),
  mask or avoid genuinely dynamic content (relative timestamps, live counts)
  rather than trying to make it deterministic — `toHaveScreenshot`'s `mask`
  option exists for exactly that.
