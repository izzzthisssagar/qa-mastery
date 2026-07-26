# Client Trust and Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make authenticated journeys honest, recoverable, keyboard-operable, screen-reader-friendly, touch-safe, and resilient across route failures, offline transitions, media, zoom/reflow, and high-contrast settings.

**Architecture:** Add interaction tests before changing behavior, then preserve server-rendered pages while isolating browser-only focus and online-state logic in small Client Components. Use one complete roving-focus menu model, one shared async-state family, one authenticated `<main>` landmark, and typed media descriptions. Integrate the previously drafted widget accessibility work by recreating its behavior against the current integration base rather than merging stacked branch tips.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript 5, Vitest 4 with jsdom, Testing Library, Playwright 1.60, axe-core, Tailwind CSS 4.

## Global Constraints

- Start from the Wave 1 integration checkpoint; do not merge branch tips `79c5a9e` or `41798ec`.
- Before route-state work, read `apps/platform/AGENTS.md` and local Next.js 16.2.11 guides `01-app/01-getting-started/10-error-handling.md`, `01-app/03-api-reference/03-file-conventions/error.md`, `01-app/03-api-reference/03-file-conventions/not-found.md`, `01-app/01-getting-started/12-images.md`, and `03-architecture/accessibility.md`.
- Next.js 16 error boundaries receive `unstable_retry`; do not use the older `reset` prop as the primary recovery API.
- Error details shown to users are generic; `error.digest` may be logged, but server messages and stack traces must not be rendered.
- Each page needs a unique title or `<h1>` because Next.js route announcements resolve title, then `<h1>`, then pathname.
- Target WCAG 2.2 AA; primary controls use at least 44-by-44 CSS pixels even though WCAG's minimum target criterion is smaller.
- Do not treat axe output as conformance evidence; keyboard, reflow, forced-colors, VoiceOver, and NVDA evidence remain required.
- Informative uploaded images require non-empty alternative text. Decorative images require an explicit `decorative: true` classification.
- Use `loading="lazy"`, `decoding="async"`, intrinsic dimensions, and a stable aspect ratio for user media below the fold.
- Preserve the server-side authentication boundary and RLS behavior.
- Do not edit workflow files, migrations, root dependency policy, `pnpm-lock.yaml`, personal-note persistence, simulator behavior, portfolio rendering, or Lane A files before the stated checkpoint.
- This lane owns `packages/ui/src/dropdown-menu.tsx`; Lane A must not modify it.
- `packages/ui/src/index.ts`, `apps/platform/src/components/nav/app-shell.tsx`, and `packages/ui/src/button.tsx` are governor-serialized integration files. Early Lane B tasks work without them; later tasks start only after Lane A lands.
- `apps/platform/src/app/(app)/notes/note-components.tsx` is serialized with Lane C. Complete Task 4 and integrate it before Lane C edits the completion component.
- Each behavior change starts with an observed failing test and ends with focused tests, lint, typecheck, and a narrow commit.

## File Map and Ownership

**Lane-owned existing files**

- `packages/ui/src/dropdown-menu.tsx` — complete menu keyboard/focus model.
- `packages/ui/test/ui.test.tsx` — retained static contracts.
- `packages/widgets/src/jira-board.tsx` — keyboard activation and announcements.
- `packages/widgets/src/sdlc-visualizer.tsx` — native buttons and live result.
- `apps/platform/src/app/(app)/learn/[slug]/quiz-panel.tsx` — reduced-motion celebration guard.
- `apps/platform/src/app/(app)/template.tsx` — route focus component mount.
- `apps/platform/src/app/(app)/notes/note-components.tsx` — Term extraction only; serialized before Lane C.
- `apps/platform/src/app/(app)/community/actions.ts` — typed media descriptions and server validation.
- `apps/platform/src/app/(app)/community/new/composer.tsx` — author-provided media descriptions.
- `apps/platform/src/app/(app)/community/post-card.tsx` — described media rendering.
- `apps/platform/src/app/(app)/community/[postId]/page.tsx` — described media rendering.
- `apps/platform/src/app/(app)/community/feed-client.tsx` — shared empty-state adoption.
- Authenticated pages containing nested `<main>` — converted to non-main wrappers after Lane A lands.
- `e2e/tests/a11y.spec.ts` — broader automated accessibility floor.

**Lane-owned new files**

- `packages/ui/test/dropdown-menu.test.tsx` — real menu interaction tests.
- `packages/ui/src/async-state.tsx` — ErrorState, NotFoundState, OfflineState, PermissionState, and RetryState.
- `packages/ui/test/async-state.test.tsx` — semantic state tests.
- `apps/platform/src/components/route-focus.tsx` — route-heading focus.
- `apps/platform/src/components/online-status.tsx` — persistent offline banner.
- `apps/platform/src/components/notes/accessible-term.tsx` — keyboard, click, touch glossary definition.
- `apps/platform/src/lib/reduced-motion.ts` — non-React media-query helper.
- `apps/platform/src/lib/community/media-metadata.ts` — server-safe media type, description, and dimensions validation.
- `apps/platform/src/lib/community/media-metadata.test.ts` — pure validation tests.
- `apps/platform/src/lib/community/image-dimensions.ts` — browser-only intrinsic-dimension reader.
- `apps/platform/src/app/error.tsx` — root route error boundary.
- `apps/platform/src/app/global-error.tsx` — root-layout failure fallback.
- `apps/platform/src/app/not-found.tsx` — branded unmatched route.
- `apps/platform/src/app/(app)/error.tsx` — shell-preserving authenticated error boundary.
- `apps/platform/test/accessibility-interactions.test.tsx` — glossary, focus, forms, state, and hydration interactions.
- `apps/platform/test/widget-keyboard-a11y.test.tsx` — widget semantic contracts.
- `apps/platform/test/quiz-panel-reduced-motion.test.ts` — celebration preference test.
- `e2e/tests/route-focus.spec.ts` — route transition focus.
- `e2e/tests/keyboard-journeys.spec.ts` — keyboard-only workflows.
- `e2e/tests/reflow-forced-colors.spec.ts` — narrow reflow and forced-color checks.
- `docs/quality/manual-accessibility-checklist.md` — repeatable VoiceOver/NVDA/manual evidence template.

**Governor-owned dependency checkpoint**

- `apps/platform/package.json`, `packages/ui/package.json`, and `pnpm-lock.yaml` are changed and committed by the integration governor before the lane branches.
- Add exact compatible development versions: `@testing-library/react@16.3.0`, `@testing-library/user-event@14.6.1`, `@testing-library/jest-dom@6.6.3`, and `jsdom@26.1.0` to both platform and UI where imported.

---

### Task 1: Establish the jsdom Interaction-Test Checkpoint

**Files:**
- Governor modify: `apps/platform/package.json`
- Governor modify: `packages/ui/package.json`
- Governor modify: `pnpm-lock.yaml`
- Verify unchanged: `apps/platform/vitest.config.ts`
- Verify unchanged: `packages/ui/vitest.config.ts`

**Interfaces:**
- Produces: file-level jsdom tests via `// @vitest-environment jsdom`; existing node suites continue using `environment: "node"`.

- [ ] **Step 1: Have the integration governor install pinned test dependencies**

Run:

```bash
pnpm --filter @qa-mastery/platform add -D @testing-library/react@16.3.0 @testing-library/user-event@14.6.1 @testing-library/jest-dom@6.6.3 jsdom@26.1.0
pnpm --filter @qa-mastery/ui add -D @testing-library/react@16.3.0 @testing-library/user-event@14.6.1 @testing-library/jest-dom@6.6.3 jsdom@26.1.0
```

Expected: both package manifests and `pnpm-lock.yaml` change once; no production dependency is added.

- [ ] **Step 2: Commit the governor-owned dependency checkpoint**

```bash
git add apps/platform/package.json packages/ui/package.json pnpm-lock.yaml
git commit -m "test: add React interaction test harness"
```

- [ ] **Step 3: Keep default Vitest environments on Node**

Verify both configs retain:

```ts
test: {
  environment: "node",
}
```

Interaction test files select jsdom with the file pragma so server-only and filesystem tests do not silently gain browser globals.

- [ ] **Step 4: Prove both packages can run a one-file jsdom probe**

Create a temporary untracked probe in each package only while verifying:

```tsx
// @vitest-environment jsdom
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

it("renders in jsdom", () => {
  render(<button>Probe</button>);
  expect(screen.getByRole("button", { name: "Probe" })).toBeTruthy();
});
```

Run: `pnpm --filter @qa-mastery/ui test -- test/jsdom-probe.test.tsx && pnpm --filter @qa-mastery/platform test -- test/jsdom-probe.test.tsx`

Expected: PASS in both packages. Remove only the two untracked probe files after the run; do not use a recursive deletion command.

### Task 2: Complete the Dropdown Menu Interaction Model

**Files:**
- Create: `packages/ui/test/dropdown-menu.test.tsx`
- Modify: `packages/ui/src/dropdown-menu.tsx`
- Modify after Lane A integration: `apps/platform/src/components/nav/avatar-menu.tsx`

**Interfaces:**
- Preserves: `DropdownMenu`, `DropdownTrigger`, `DropdownContent`, `DropdownItem`, and `DropdownSeparator`.
- Adds: `DropdownItemProps.asChild?: boolean`, `disabled?: boolean`, and roving focus across enabled `[role="menuitem"]` descendants.
- Keyboard contract: Enter/Space/ArrowDown on trigger opens and focuses first; ArrowUp opens and focuses last; ArrowUp/ArrowDown wrap; Home/End jump; printable characters perform one-second typeahead; Escape closes and returns focus; Tab closes without trapping.

- [ ] **Step 1: Write failing interaction tests**

Create `dropdown-menu.test.tsx` with `// @vitest-environment jsdom` and this harness:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import {
  DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem,
} from "../src";

function Harness() {
  return (
    <DropdownMenu>
      <DropdownTrigger aria-label="Account menu">A</DropdownTrigger>
      <DropdownContent>
        <DropdownItem>Profile</DropdownItem>
        <DropdownItem disabled>Unavailable</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Sign out</DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}

it("opens with ArrowDown and wraps enabled items", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Account menu" });
  trigger.focus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveFocus();
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
});

it("supports Home, End, typeahead, and Escape focus return", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Account menu" });
  await user.click(trigger);
  await user.keyboard("{End}");
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
  await user.keyboard("s");
  expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole("menu")).toBeNull();
});
```

- [ ] **Step 2: Run the focused tests and observe focus failures**

Run: `pnpm --filter @qa-mastery/ui test -- test/dropdown-menu.test.tsx`

Expected: FAIL because opening does not move focus and Arrow/Home/End/typeahead are not handled.

- [ ] **Step 3: Add menu refs and roving-focus helpers**

Extend context with `contentRef`, `openMenu(focus: "first" | "last")`, and `closeMenu({ restoreFocus })`. Query only `button[role="menuitem"]:not([disabled]),a[role="menuitem"]` inside the current menu. Keep the menu mounted only while open.

- [ ] **Step 4: Add trigger and content keyboard handlers**

Prevent default for handled menu keys. Buffer printable keys for one second, compare lowercased `textContent.trim()`, and focus the next matching item after the current index. Do not trap Tab.

- [ ] **Step 5: Add `asChild` without nested interactive elements**

When `asChild` is true, require one valid React element and clone it with `role="menuitem"`, `tabIndex={-1}`, merged className, and a composed click handler. After Lane A lands, change avatar links to:

```tsx
<DropdownItem asChild>
  <Link href="/portfolio/me">Profile</Link>
</DropdownItem>
```

Do the same for Settings, removing the current Link-around-button nesting.

- [ ] **Step 6: Run interaction, static, and type checks**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS; disabled items are skipped and links contain no nested buttons.

- [ ] **Step 7: Commit the complete menu model**

```bash
git add packages/ui/src/dropdown-menu.tsx packages/ui/test/dropdown-menu.test.tsx apps/platform/src/components/nav/avatar-menu.tsx
git commit -m "fix(a11y): complete dropdown keyboard behavior"
```

### Task 3: Integrate Route Focus and Reduced-Motion Guards

**Files:**
- Create: `apps/platform/src/components/route-focus.tsx`
- Create: `apps/platform/src/lib/reduced-motion.ts`
- Create: `apps/platform/test/quiz-panel-reduced-motion.test.ts`
- Modify: `apps/platform/src/app/(app)/template.tsx`
- Modify: `apps/platform/src/app/(app)/learn/[slug]/quiz-panel.tsx`
- Create: `e2e/tests/route-focus.spec.ts`

**Interfaces:**
- Produces: `RouteFocusHeading()` and `prefersReducedMotion(): boolean`.
- `RouteFocusHeading` runs once per `(app)/template.tsx` remount and focuses the first `#main-content h1` with `preventScroll: true`.

- [ ] **Step 1: Write the reduced-motion unit test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "../src/lib/reduced-motion";

describe("prefersReducedMotion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reflects the reduce media query", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" }),
    });
    expect(prefersReducedMotion()).toBe(true);
  });
});
```

- [ ] **Step 2: Write the failing route-focus browser test**

```ts
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

test("client navigation focuses the new page heading", async ({ page }) => {
  await signUpFreshLearner(page, "route-focus");
  await page.getByRole("link", { name: "Community" }).first().click();
  await expect(page).toHaveURL(/\/community/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeFocused();
});
```

- [ ] **Step 3: Run both tests and observe missing behavior**

Run: `pnpm --filter @qa-mastery/platform test -- test/quiz-panel-reduced-motion.test.ts && pnpm --filter @qa-mastery/e2e exec playwright test tests/route-focus.spec.ts --project=chromium`

Expected: unit FAIL because helper is missing; browser FAIL because focus remains on the navigation link.

- [ ] **Step 4: Implement the media-query helper and quiz guard**

```ts
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
```

In `QuizPanel`, invoke canvas confetti only when `res.passed && !prefersReducedMotion()`.

- [ ] **Step 5: Implement and mount route focus**

`RouteFocusHeading` adds `tabindex="-1"` only when absent and focuses the heading without scrolling. Mount it before `{children}` in `(app)/template.tsx`; keep `Reveal fade={false}` so content is not hidden before hydration.

- [ ] **Step 6: Run unit, browser, lint, and type checks**

Run: `pnpm --filter @qa-mastery/platform test -- test/quiz-panel-reduced-motion.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/route-focus.spec.ts`

Expected: PASS in Chromium and WebKit; no scroll jump and no confetti under reduced motion.

- [ ] **Step 7: Commit route and motion accessibility**

```bash
git add apps/platform/src/components/route-focus.tsx apps/platform/src/lib/reduced-motion.ts apps/platform/test/quiz-panel-reduced-motion.test.ts apps/platform/src/app/'(app)'/template.tsx apps/platform/src/app/'(app)'/learn/'[slug]'/quiz-panel.tsx e2e/tests/route-focus.spec.ts
git commit -m "fix(a11y): manage route focus and reduced motion"
```

### Task 4: Make Glossary Terms Operable on Keyboard, Touch, and Pointer

**Files:**
- Create: `apps/platform/src/components/notes/accessible-term.tsx`
- Create: `apps/platform/test/accessibility-interactions.test.tsx`
- Modify: `apps/platform/src/app/(app)/notes/note-components.tsx`

**Interfaces:**
- Produces: `AccessibleTerm({ define: string; children: ReactNode })` with button trigger, stable `aria-describedby`, click/focus open, Escape close, outside-pointer close, and no hover-only dependency.
- `note-components.tsx` re-exports it as `Term` so all existing MDX remains unchanged.

- [ ] **Step 1: Write failing glossary interaction tests**

Create `accessibility-interactions.test.tsx` with `// @vitest-environment jsdom`:

```tsx
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { AccessibleTerm } from "../src/components/notes/accessible-term";

it("reveals a glossary definition on focus/click and closes on Escape", async () => {
  const user = userEvent.setup();
  render(<AccessibleTerm define="A release check performed quickly">Smoke test</AccessibleTerm>);
  const trigger = screen.getByRole("button", { name: "Smoke test" });
  await user.tab();
  expect(trigger).toHaveFocus();
  expect(screen.getByRole("tooltip")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).toBeNull();
  await user.click(trigger);
  expect(screen.getByText("A release check performed quickly")).toBeVisible();
});
```

- [ ] **Step 2: Run the test and observe the missing component**

Run: `pnpm --filter @qa-mastery/platform test -- test/accessibility-interactions.test.tsx`

Expected: FAIL because `AccessibleTerm` does not exist.

- [ ] **Step 3: Implement the accessible term**

Use `useId`, `useRef`, and controlled `open`. Render a zero-reset inline button with the dashed underline; render the definition only while open or focused. Set `aria-expanded`, `aria-describedby`, and `aria-haspopup="true"`. Hover may open it, but blur/click/Escape must provide equivalent non-hover operation.

- [ ] **Step 4: Preserve the MDX component name**

Remove the old hover-only `Term` function from `note-components.tsx`, import `AccessibleTerm`, and add:

```ts
export { AccessibleTerm as Term };
```

- [ ] **Step 5: Run the interaction test and notes E2E smoke**

Run: `pnpm --filter @qa-mastery/platform test -- test/accessibility-interactions.test.tsx && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/notes-v2.spec.ts --project=chromium`

Expected: PASS; existing MDX still resolves `Term`, and definitions are reachable without hover.

- [ ] **Step 6: Commit and release the serialized note-component lock**

```bash
git add apps/platform/src/components/notes/accessible-term.tsx apps/platform/test/accessibility-interactions.test.tsx apps/platform/src/app/'(app)'/notes/note-components.tsx
git commit -m "fix(a11y): make glossary terms input agnostic"
```

Notify the governor that Lane C may now rebase its note-save task on this commit.

### Task 5: Add Shared Recovery States and Next.js Error Boundaries

**Files:**
- Create: `packages/ui/src/async-state.tsx`
- Create: `packages/ui/test/async-state.test.tsx`
- Governor modify after Lane A: `packages/ui/src/index.ts`
- Create: `apps/platform/src/app/error.tsx`
- Create: `apps/platform/src/app/global-error.tsx`
- Create: `apps/platform/src/app/not-found.tsx`
- Create: `apps/platform/src/app/(app)/error.tsx`
- Create: `apps/platform/src/components/online-status.tsx`
- Governor modify after Lane A: `apps/platform/src/components/nav/app-shell.tsx`
- Modify: `apps/platform/src/app/(app)/community/feed-client.tsx`

**Interfaces:**
- Produces: `AsyncStateProps = { title: string; description: string; action?: ReactNode; icon?: IconName }` and `ErrorState`, `NotFoundState`, `OfflineState`, `PermissionState`, `RetryState`.
- Produces: `OnlineStatus()` with a persistent `role="status"` offline banner; it does not claim queued work is synchronized.

- [ ] **Step 1: Write failing semantic state tests**

Create `async-state.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ErrorState, NotFoundState, OfflineState, PermissionState } from "../src/async-state";

describe("async states", () => {
  it("renders one heading, explanatory text, and an action", () => {
    const html = renderToStaticMarkup(
      <ErrorState title="Could not load" description="Try the request again." action={<button>Retry</button>} />,
    );
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain("Try the request again.");
    expect(html).toContain("Retry");
  });

  it("uses distinct copy for missing, offline, and denied states", () => {
    expect(renderToStaticMarkup(<NotFoundState />)).toContain("couldn’t find");
    expect(renderToStaticMarkup(<OfflineState />)).toContain("offline");
    expect(renderToStaticMarkup(<PermissionState />)).toContain("permission");
  });
});
```

- [ ] **Step 2: Run state tests and observe the missing module**

Run: `pnpm --filter @qa-mastery/ui test -- test/async-state.test.tsx`

Expected: FAIL because `async-state.tsx` does not exist.

- [ ] **Step 3: Implement the shared state family**

Build all state variants over a private `AsyncState` component with `role="alert"` only for blocking errors and permissions; offline/not-found explanatory states remain ordinary sections. Default actions are absent rather than fake buttons.

- [ ] **Step 4: Have the governor append explicit UI exports after Lane A**

```ts
export {
  ErrorState, NotFoundState, OfflineState, PermissionState, RetryState,
  type AsyncStateProps,
} from "./async-state";
```

- [ ] **Step 5: Add route boundary unit-facing markup**

`app/error.tsx` and `(app)/error.tsx` are Client Components accepting:

```ts
{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}
```

Log only `error.digest ?? "client-error"` in an effect and render `ErrorState` with a Retry button calling `unstable_retry`. `global-error.tsx` includes its own `<html><body>`, a `<title>QA Mastery error</title>`, and the same generic recovery copy. `not-found.tsx` is a Server Component with links to `/` and `/dashboard`.

- [ ] **Step 6: Implement honest online status**

Initialize from `navigator.onLine` only after hydration, listen for `online` and `offline`, and show a persistent banner while offline: “You’re offline. Changes remain local only where the screen explicitly says so.” Do not display a global “Saved” message.

- [ ] **Step 7: Have the governor mount `OnlineStatus` in the integrated AppShell**

Place it immediately before the content region so it is visible across authenticated routes without introducing a second `<main>`.

- [ ] **Step 8: Standardize the Community empty state**

Replace the dashed paragraph in `FeedClient` with `EmptyState`. For Following, title `Nothing from followed members yet`, description `Follow QA learners to build a focused feed.`, and an action linking to `/community`. For Latest, title `Start the first conversation`, description `Ask a testing question or share what you learned.`, and an action linking to `/community/new`.

- [ ] **Step 9: Run UI, platform, and build verification**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/platform build`

Expected: PASS; Next accepts `unstable_retry`, global error includes document tags, and no server/client boundary error appears.

- [ ] **Step 10: Commit recovery states after governor reconciliation**

```bash
git add packages/ui/src/async-state.tsx packages/ui/test/async-state.test.tsx packages/ui/src/index.ts apps/platform/src/app/error.tsx apps/platform/src/app/global-error.tsx apps/platform/src/app/not-found.tsx apps/platform/src/app/'(app)'/error.tsx apps/platform/src/components/online-status.tsx apps/platform/src/components/nav/app-shell.tsx apps/platform/src/app/'(app)'/community/feed-client.tsx
git commit -m "feat(platform): add honest recovery states"
```

### Task 6: Establish One Main Landmark and Skip Navigation

**Files:**
- Modify after Lane A integration: `apps/platform/src/components/nav/app-shell.tsx`
- Modify: `apps/platform/src/app/(app)/buggyapi/report/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/new/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/[postId]/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/tags/[tag]/page.tsx`
- Modify: `apps/platform/src/app/(app)/tasks/page.tsx`
- Modify: `e2e/tests/a11y.spec.ts`

**Interfaces:**
- Produces: exactly one authenticated `<main id="main-content" tabIndex={-1}>` and a first-focusable skip link targeting it.

- [ ] **Step 1: Add a failing landmark and skip-link assertion**

In the authenticated dashboard axe test, add:

```ts
await expect(page.locator("main")).toHaveCount(1);
const skip = page.getByRole("link", { name: "Skip to main content" });
await page.keyboard.press("Tab");
await expect(skip).toBeFocused();
await skip.press("Enter");
await expect(page.locator("#main-content")).toBeFocused();
```

Add the same `main` count assertion to Notes, Tasks, Test cases, and Talent.

- [ ] **Step 2: Run the dashboard and notes checks and observe failure**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/a11y.spec.ts --project=chromium --grep "dashboard|notes topic"`

Expected: FAIL because no skip link exists and nested authenticated pages can produce more than one `<main>`.

- [ ] **Step 3: Add the shell-owned main and skip link**

At the beginning of `AppShell`, render:

```tsx
<a
  href="#main-content"
  className="sr-only z-[100] rounded-control bg-accent px-4 py-3 text-accent-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
>
  Skip to main content
</a>
```

Wrap breadcrumbs and children in `<main id="main-content" tabIndex={-1}>`.

- [ ] **Step 4: Remove nested authenticated main landmarks**

For each listed Lane B page, replace its outer `<main>` with `<div>` while preserving className, closing tag, metadata, and inner headings. Lane C makes the same change in the Knowledge Base and Simulator pages it already owns. Do not alter public marketing/auth route `<main>` elements because they are outside `AppShell`.

- [ ] **Step 5: Align route focus with the single main**

Change the query to `document.querySelector<HTMLElement>("#main-content h1")`. Do not focus the main automatically during ordinary navigation; the heading remains the route-change target.

- [ ] **Step 6: Run landmark, axe, lint, and type checks**

Run: `pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/a11y.spec.ts --project=chromium`

Expected: PASS; every sampled authenticated route has one main and the skip link transfers focus.

- [ ] **Step 7: Commit landmark consistency**

```bash
git add apps/platform/src/components/nav/app-shell.tsx apps/platform/src/components/route-focus.tsx apps/platform/src/app/'(app)'/buggyapi/report/page.tsx apps/platform/src/app/'(app)'/community/page.tsx apps/platform/src/app/'(app)'/community/new/page.tsx apps/platform/src/app/'(app)'/community/'[postId]'/page.tsx apps/platform/src/app/'(app)'/community/tags/'[tag]'/page.tsx apps/platform/src/app/'(app)'/tasks/page.tsx e2e/tests/a11y.spec.ts
git commit -m "fix(a11y): establish skip link and single main"
```

### Task 7: Enforce Touch Targets and Visible Focus

**Files:**
- Modify after Lane A integration: `packages/ui/src/button.tsx` — Lane A applies design-token colors/variants first; this step's touch-target/focus-ring change must land on Lane A's integrated button.tsx, not the pre-integration checkpoint copy.
- Modify after Lane A integration: `apps/platform/src/components/nav/avatar-menu.tsx`
- Modify after Lane A integration: `apps/platform/src/components/nav/notification-bell.tsx`
- Modify: `apps/platform/src/app/(app)/community/new/composer.tsx`
- Modify: `apps/platform/src/app/(app)/community/post-card.tsx`
- Create: `e2e/tests/keyboard-journeys.spec.ts`

**Interfaces:**
- Produces: a 44px minimum on shared buttons, icon buttons, upload labels, community actions, menu items, and mobile navigation; every keyboard-focusable control has a visible accent outline or ring.

- [ ] **Step 1: Write a failing target-size and keyboard journey**

```ts
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

test("primary shell controls are keyboard reachable and at least 44px", async ({ page }) => {
  await signUpFreshLearner(page, "keyboard-shell");
  for (const name of ["Notifications", "Account menu"]) {
    const control = page.getByRole("button", { name });
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
});
```

- [ ] **Step 2: Run the journey and observe 36px control failures**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/keyboard-journeys.spec.ts --project=chromium`

Expected: FAIL because avatar and notification buttons are `h-9 w-9`.

- [ ] **Step 3: Raise shared and icon-button floors**

Add `min-h-11 min-w-11` to `Button`. Change avatar and notification controls from `h-9 w-9` to `size-11`. Preserve visual icon size with an inner SVG; do not enlarge unread-badge text.

- [ ] **Step 4: Make community attachment and reaction controls touch-safe**

Use `inline-flex min-h-11 items-center` on upload labels, like/comment actions, and composer kind controls. Add `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent` to each control lacking a visible focus style.

- [ ] **Step 5: Run UI, platform, and keyboard verification**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/keyboard-journeys.spec.ts`

Expected: PASS in Chromium and WebKit; all measured shell controls meet 44px.

- [ ] **Step 6: Commit target and focus corrections**

```bash
git add packages/ui/src/button.tsx apps/platform/src/components/nav/avatar-menu.tsx apps/platform/src/components/nav/notification-bell.tsx apps/platform/src/app/'(app)'/community/new/composer.tsx apps/platform/src/app/'(app)'/community/post-card.tsx e2e/tests/keyboard-journeys.spec.ts
git commit -m "fix(a11y): normalize touch targets and focus"
```

### Task 8: Require Described, Stable Community Images

**Files:**
- Create: `apps/platform/src/lib/community/media-metadata.ts`
- Create: `apps/platform/src/lib/community/media-metadata.test.ts`
- Create: `apps/platform/src/lib/community/image-dimensions.ts`
- Modify: `apps/platform/src/app/(app)/community/actions.ts`
- Modify: `apps/platform/src/app/(app)/community/new/composer.tsx`
- Modify: `apps/platform/src/app/(app)/community/post-card.tsx`
- Modify: `apps/platform/src/app/(app)/community/[postId]/page.tsx`
- Modify: `e2e/tests/community.spec.ts`

**Interfaces:**
- Moves `MediaItem` into `media-metadata.ts`, extends it with `alt?: string`, `decorative?: boolean`, `width?: number`, and `height?: number`, and re-exports the type from Community actions for existing consumers.
- Produces: `validateMediaItems(items): MediaItem[]` in the server-safe module and `readImageDimensions(file): Promise<{ width: number; height: number }>` in the browser adapter.
- Server contract: image item is accepted only when `(decorative === true && alt is empty)` or `alt.trim().length` is `1..240`; width/height must be positive integers.

- [ ] **Step 1: Write failing media validation tests**

```ts
import { describe, expect, it } from "vitest";
import { validateMediaItems } from "./media-metadata";

describe("community media metadata", () => {
  it("rejects an informative image without alternative text", () => {
    expect(() => validateMediaItems([{ type: "image", path: "u/a.png", width: 800, height: 600 }])).toThrow(
      "Describe each informative image",
    );
  });

  it("accepts described and explicitly decorative images", () => {
    expect(validateMediaItems([
      { type: "image", path: "u/a.png", alt: "Checkout total ignores quantity", width: 800, height: 600 },
      { type: "image", path: "u/b.png", alt: "", decorative: true, width: 100, height: 100 },
    ])).toHaveLength(2);
  });

  it("rejects missing intrinsic dimensions", () => {
    expect(() => validateMediaItems([{ type: "image", path: "u/a.png", alt: "Bug screenshot" }])).toThrow(
      "Image dimensions are required",
    );
  });
});
```

- [ ] **Step 2: Run validation tests and observe the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/community/media-metadata.test.ts`

Expected: FAIL because the validation module is absent.

- [ ] **Step 3: Implement pure server-safe validation**

Trim alt text, cap it at 240 Unicode code units, reject contradictory `decorative: true` plus non-empty alt, and return a sanitized copy. Videos retain their current provider/url fields and bypass image dimensions.

- [ ] **Step 4: Validate on the server before insert**

In `createPost`, call `validateMediaItems(input.media ?? [])` and write the returned array. Do not trust client disablement as enforcement.

- [ ] **Step 5: Capture dimensions and description in Composer**

After upload, call `readImageDimensions(file)` from `image-dimensions.ts` using an object URL and `Image`; always revoke the object URL after load/error. Add an attachment row with a required description input and `Mark decorative` checkbox. Disable Post when any image violates the same rules; keep server errors inline with `role="alert"`.

- [ ] **Step 6: Render stable, lazy images**

In feed and thread, render `alt={image.decorative ? "" : image.alt}`, `width={image.width}`, `height={image.height}`, `loading="lazy"`, `decoding="async"`, and `style={{ aspectRatio: `${image.width} / ${image.height}` }}`. Add `aria-hidden={image.decorative || undefined}` only for explicit decorative media.

- [ ] **Step 7: Extend the Community browser journey**

Upload an image fixture, assert Post remains disabled until description text is entered, submit, and assert the rendered image has the same `alt`, positive `width`, and positive `height` attributes.

- [ ] **Step 8: Run media, Community, lint, and type verification**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/community/media-metadata.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/community.spec.ts --project=chromium`

Expected: PASS; server validation rejects undescribed images and rendered uploads are stable and described.

- [ ] **Step 9: Commit described media support**

```bash
git add apps/platform/src/lib/community/media-metadata.ts apps/platform/src/lib/community/media-metadata.test.ts apps/platform/src/lib/community/image-dimensions.ts apps/platform/src/app/'(app)'/community/actions.ts apps/platform/src/app/'(app)'/community/new/composer.tsx apps/platform/src/app/'(app)'/community/post-card.tsx apps/platform/src/app/'(app)'/community/'[postId]'/page.tsx e2e/tests/community.spec.ts
git commit -m "fix(a11y): require described community media"
```

### Task 9: Integrate Widget Keyboard and Screen-Reader Behavior

**Files:**
- Create: `apps/platform/test/widget-keyboard-a11y.test.tsx`
- Modify: `packages/widgets/src/jira-board.tsx`
- Modify: `packages/widgets/src/sdlc-visualizer.tsx`

**Interfaces:**
- Jira tickets expose native or equivalent buttons, Enter/Space activation, action labels, disabled Done state, and a polite live announcement.
- SDLC phases are native buttons with `aria-pressed`; the result panel is a polite live region.

- [ ] **Step 1: Write the failing static semantic contracts**

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JiraBoard, SDLCVisualizer } from "@qa-mastery/widgets";

describe("interactive widget semantics", () => {
  it("makes Jira tickets focusable actions with a live region", () => {
    const html = renderToStaticMarkup(<JiraBoard />);
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("Activate to move to");
    expect(html).toContain('aria-live="polite"');
  });

  it("uses native pressed buttons for SDLC phases", () => {
    const html = renderToStaticMarkup(<SDLCVisualizer />);
    expect(html).toContain("<button");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("cost to fix a defect found here is");
  });
});
```

- [ ] **Step 2: Run the test and observe semantic failures**

Run: `pnpm --filter @qa-mastery/platform test -- test/widget-keyboard-a11y.test.tsx`

Expected: FAIL because Jira uses click-only divs and SDLC phases are not buttons.

- [ ] **Step 3: Implement deterministic Jira transitions and announcements**

Add `COLUMN_TITLE` and `NEXT_STATUS` records. Open tickets receive `role="button" tabIndex={0}`, activate on Enter/Space, and announce `${ticket.id} moved to ${COLUMN_TITLE[next]}`. Done tickets receive `aria-disabled="true"` and `tabIndex={-1}`.

- [ ] **Step 4: Convert SDLC phases to native buttons**

Preserve layout and Motion wrappers, but put the click handler on a `<button type="button">` with an exact cost label and `aria-pressed`. Mark the result panel `role="status" aria-live="polite"`.

- [ ] **Step 5: Run widget, package, lint, and type checks**

Run: `pnpm --filter @qa-mastery/platform test -- test/widget-keyboard-a11y.test.tsx && pnpm --filter @qa-mastery/widgets test && pnpm --filter @qa-mastery/widgets typecheck && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS with focusable ticket actions and pressed phase buttons.

- [ ] **Step 6: Commit widget accessibility**

```bash
git add apps/platform/test/widget-keyboard-a11y.test.tsx packages/widgets/src/jira-board.tsx packages/widgets/src/sdlc-visualizer.tsx
git commit -m "fix(widgets): add keyboard and live-region behavior"
```

### Task 10: Add Reflow, Forced-Colors, and Keyboard-Only Browser Gates

**Files:**
- Create: `e2e/tests/reflow-forced-colors.spec.ts`
- Modify: `e2e/tests/keyboard-journeys.spec.ts`
- Modify: `e2e/tests/a11y.spec.ts`

**Interfaces:**
- Produces: automated evidence for 320 CSS-pixel reflow, forced-colors visibility, shell/menu/glossary keyboard journeys, and all major authenticated route axe scans in both themes.

- [ ] **Step 1: Add a failing 320px reflow test**

```ts
test("dashboard and Knowledge Base reflow without horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await signUpFreshLearner(page, "reflow");
  for (const path of ["/dashboard", "/notes", "/simulator", "/community", "/portfolio/me"]) {
    await page.goto(`http://localhost:3000${path}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});
```

- [ ] **Step 2: Add a forced-colors focus test**

```ts
test("forced-colors keeps active and focus indicators visible", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await signUpFreshLearner(page, "forced-colors");
  const community = page.getByRole("link", { name: "Community" }).first();
  community.focus();
  await expect(community).toBeFocused();
  const outline = await community.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe("none");
});
```

- [ ] **Step 3: Run new tests and capture any concrete overflow/focus failure**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/reflow-forced-colors.spec.ts --project=chromium`

Expected: initial FAIL identifies an exact route/control if layout or forced-color focus is still defective.

- [ ] **Step 4: Correct only demonstrated reflow and forced-color defects**

If the shell or Community fails, restrict corrections to `apps/platform/src/components/nav/app-shell.tsx`, `apps/platform/src/app/(app)/community/feed-client.tsx`, or `apps/platform/src/app/(app)/community/post-card.tsx`, using `min-w-0`, responsive wrapping, and `forced-colors:outline`. A Simulator or Portfolio failure is returned to Lane C with the exact test output instead of crossing its path lock.

- [ ] **Step 5: Extend keyboard journey through menu and glossary**

Tab from skip link to primary navigation, open Account with Enter, traverse with ArrowDown, close with Escape, navigate to a known Knowledge Base topic, focus a glossary Term, reveal it, and close it without pointer input.

- [ ] **Step 6: Expand axe route coverage**

Add Community, Simulator, Portfolio, Settings, and component gallery in both themes. Keep serious/critical violations as the automated floor and preserve incomplete contrast logging.

- [ ] **Step 7: Run all client accessibility browser gates**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/a11y.spec.ts tests/keyboard-journeys.spec.ts tests/reflow-forced-colors.spec.ts tests/route-focus.spec.ts`

Expected: PASS in Chromium and WebKit with no serious/critical axe violations.

- [ ] **Step 8: Commit accessibility browser gates and proven fixes**

```bash
git add e2e/tests/a11y.spec.ts e2e/tests/keyboard-journeys.spec.ts e2e/tests/reflow-forced-colors.spec.ts e2e/tests/route-focus.spec.ts
git add apps/platform/src/components/nav/app-shell.tsx apps/platform/src/app/'(app)'/community/feed-client.tsx apps/platform/src/app/'(app)'/community/post-card.tsx
git commit -m "test(a11y): gate keyboard reflow and forced colors"
```

Before committing, use `git diff --cached --name-only` and unstage any of the three source files that did not change; never use `git add apps/platform/src` for this evidence-driven correction.

### Task 11: Perform and Record Manual VoiceOver and NVDA Verification

**Files:**
- Create: `docs/quality/manual-accessibility-checklist.md`

**Interfaces:**
- Produces: a dated evidence table with browser, screen reader, OS, route, journey, expected announcement, observed result, status, and issue link.

- [ ] **Step 1: Create the repeatable checklist**

Include exact journeys: skip to content; desktop rail/current route; mobile bottom nav; Account menu arrow/Home/End/typeahead/Escape; Light/Dark/System; client-route heading focus; glossary reveal; community image description; simulator editor fallback; offline banner; route error retry; not found recovery; Jira movement announcement; SDLC result announcement; 200% zoom; 400% reflow; forced colors.

- [ ] **Step 2: Run VoiceOver with Safari on macOS**

Record the exact spoken output and status for every journey. A visual-only pass or “works” is not evidence; include the announced control role, name, state, and route change.

- [ ] **Step 3: Run NVDA with current Firefox or Chrome on Windows**

Record the same fields. If Windows hardware is unavailable, mark each NVDA row `Blocked — Windows/NVDA environment required`; do not mark it passed from VoiceOver results.

- [ ] **Step 4: File and link failures before declaring the lane complete**

Every failed row receives an issue ID, severity, reproduction steps, and owner. Critical keyboard, route recovery, and screen-reader blockers prevent lane integration.

- [ ] **Step 5: Commit the evidence template and completed rows**

```bash
git add docs/quality/manual-accessibility-checklist.md
git commit -m "docs(a11y): record manual assistive technology evidence"
```

### Task 12: Complete Lane Verification and Handoff

**Files:**
- No new source files.

**Interfaces:**
- Produces: clean owned-path diff and reproducible evidence for the integration governor.

- [ ] **Step 1: Confirm ownership and serialized integrations**

Run: `git diff --name-only codex/qa-mastery-remediation-program...HEAD` after rebasing onto the latest recorded integration checkpoint.

Expected: only files in this plan plus exact reflow fixes recorded in Task 10; no migrations, workflows, simulator behavior, portfolio rendering, lockfile, or personal-note persistence.

- [ ] **Step 2: Run all unit and package checks**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck && pnpm --filter @qa-mastery/widgets test && pnpm --filter @qa-mastery/widgets typecheck && pnpm --filter @qa-mastery/platform test && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: all commands exit 0.

- [ ] **Step 3: Build the platform**

Run: `pnpm --filter @qa-mastery/platform build`

Expected: exit 0; Next.js accepts all error/not-found conventions and client boundaries.

- [ ] **Step 4: Run all accessibility browser checks**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/a11y.spec.ts tests/keyboard-journeys.spec.ts tests/reflow-forced-colors.spec.ts tests/route-focus.spec.ts`

Expected: PASS in Chromium and WebKit.

- [ ] **Step 5: Record the handoff**

```text
Base commit:
Head commit:
Owned-path diff:
UI tests:
Widget tests:
Platform tests:
Lint:
Typecheck:
Build:
Chromium accessibility:
WebKit accessibility:
VoiceOver evidence:
NVDA evidence or explicit environment blocker:
Open issue IDs:
Serialized Lane A index/AppShell reconciliation commit:
Serialized Lane C note-components release commit:
```
