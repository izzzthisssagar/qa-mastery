# Unresolved — `/dashboard` renders blank on first paint immediately after signup redirect

**Status:** found, not root-caused · **Severity:** unknown (self-heals on reload; blast radius unconfirmed) · **Filed:** 2026-07-22

## What was observed

While doing the visual verification this project had never had (no Chrome
extension connected all session — see [[Claude Coordination.md]] 2026-07-22
entries), a Playwright screenshot taken right after `signUpFreshLearner`
redirects to `/dashboard` (3s settle time already given) came back **solid
background, zero visible text or cards** — not an error page, not a loading
skeleton, just blank.

A second screenshot of the exact same page, taken after nothing but
`page.reload()`, rendered **perfectly** — full styling, XP stats, all 9
tracks, every card.

## What was ruled out before filing this

- **Not missing content.** `document.body.innerText` on the blank paint
  dumped the entire dashboard text correctly — XP stats, "Nothing started
  yet," all 9 tracks with their modules, hub cards. 61KB of HTML present.
- **Not a JS crash.** `page.on("console")` and `page.on("pageerror")`
  listeners attached from before signup through the screenshot captured
  nothing — zero console output, zero errors.
- **Not missing CSS.** `document.styleSheets` showed 2 real chunk files
  loaded (`/_next/static/chunks/*.css`). Computed styles were correct on the
  broken paint: `body` background `rgb(9, 9, 11)`, `h1` color
  `rgb(244, 244, 245)` — real near-black-on-near-white contrast, not a
  color collision.
- **Not `<main>` being hidden.** Computed style on `<main>` during the blank
  paint: `display=block opacity=1 visibility=visible height=4618px`.

None of the usual suspects for a "looks blank" bug were true. Content,
styles, and layout were all individually correct — the composited paint
just didn't show it.

## What this looks like

Same shape as [[hydration-double-render]] and [[webkit-save-stall]]: a
transient client-side race specific to the moment right after a
client-side redirect into a freshly-hydrated page, not a real absence of
anything. `/dashboard` is reached via `router.push` (or equivalent) from
`/signup` on a successful auth call — a full top-level navigation, not a
link click from within the app shell — which may be what's different about
this path versus every other page transition in the same test run (the
same Playwright session's subsequent navigations to `/notes/.../...`
painted correctly on the very first try, no reload needed).

## Why this wasn't chased further here

Found incidentally during a verification pass (Phase C/D labs work,
2026-07-22), not while working on the dashboard itself — nothing this
session touched renders or routes `/dashboard`. Root-causing this properly
needs the same kind of instrumented repro the hydration-double-render
investigation used (raw SSR HTML vs. early/late DOM polls), which is real
investigative work, not a side-effect of an unrelated verification pass.

## Open questions for whoever picks this up

- Does a **normal** dashboard visit (clicking a nav link from elsewhere in
  the app, not landing via the signup redirect) reproduce it, or is it
  specific to the post-auth client redirect?
- Is this the same root cause as `hydration-double-render` (a transient
  double-render that reconciles down), or a distinct issue where the first
  paint commits with a stale/incomplete state?
- Does it reproduce in `pnpm dev` as well as the production build this was
  found against (`next start`, via Playwright's `webServer`)?
