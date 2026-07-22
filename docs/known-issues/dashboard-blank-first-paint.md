# Resolved — `/dashboard` (and every `(app)` route) rendered blank on first paint under slow JS

**Status:** root-caused & fixed 2026-07-22 · **Severity:** launch-blocker (real UX regression, not test-infra) · **Filed:** 2026-07-22

## Root cause

`(app)/template.tsx` wraps every authenticated route's children in
`<Reveal y={8}>` (`components/motion.tsx`). `Reveal` defaults `fade={true}`,
which sets `initial={{ opacity: 0, y }}` — the entire page content starts
invisible until React hydrates and the mount animation plays. Because
`template.tsx` is the shared wrapper for the whole `(app)` route group, this
gated first paint on **every** authenticated page (dashboard, learn, notes,
talent, community, …), not just dashboard — the doc's own JSDoc on `Reveal`
already warned this yields "a blank hero for slow-JS visitors."

`dashboard/page.tsx` and `learn/[slug]/page.tsx` additionally wrap their own
above-the-fold hero content (the LCP heading) in a second, nested `<Reveal>`
with the same `fade=true` default — so even fixing the template alone would
have left the H1 opacity-gated on those two routes.

This explains every observation in the original repro: content/CSS/layout
were all correct (nothing was missing — see "What was ruled out" below,
kept for record), the composited paint just had `opacity: 0` on the whole
subtree until motion's mount animation resolved. Slower JS (throttled CPU/
network, or a cold post-signup redirect where nothing is warm yet) simply
widens the window where a screenshot lands mid-fade or pre-hydration.

## The fix

- `(app)/template.tsx`: `<Reveal y={8} fade={false}>` — the shared
  authenticated-shell wrapper no longer opacity-gates any route.
- `(app)/dashboard/page.tsx`: the hero `Reveal` (page title + subtitle) is
  now `fade={false}`.
- `(app)/learn/[slug]/page.tsx`: the three header `Reveal`s (module tag,
  lesson title, duration line) are now `fade={false}`.
- Below-the-fold content (staggered dashboard cards, `RevealOnView` sections
  elsewhere) is untouched — those aren't visible at first paint regardless.
- Repro test: `e2e/tests/dashboard-first-paint.spec.ts` (chromium, CDP 6x
  CPU throttle + slow-4G network emulation) asserts the dashboard H1's
  computed opacity is 1 immediately after `domcontentloaded`, across 20
  consecutive cold-cache reloads.

## What was ruled out before root-causing this (kept for record)

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
  paint: `display=block opacity=1 visibility=visible height=4618px` — the
  `opacity: 0` was on the inner `Reveal` `motion.div`, not `<main>` itself.
