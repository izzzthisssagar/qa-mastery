# Client Shell and Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a governed visual system and an adaptive authenticated shell with direct navigation, visible route context, three-state theming, consistent SVG icons, reusable page templates, command navigation, and reduced-motion-safe celebration behavior.

**Architecture:** Keep the authenticated layout a Server Component for the Supabase authorization boundary, then pass serializable user and feature data into a small client `AppShell` that owns pathname-dependent navigation. Put framework-neutral visual primitives in `@qa-mastery/ui`; keep Next.js routing, local-storage history, theme selection, and application navigation in `apps/platform`. Use one route registry as the source for the rail, bottom navigation, breadcrumbs, command palette, and recent destinations.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript 5, Tailwind CSS 4 semantic tokens, next-themes, Motion 12, Vitest 4, Playwright 1.60.

## Global Constraints

- Start from the Wave 1 integration checkpoint, not an open stacked PR tip.
- Read `apps/platform/AGENTS.md` and the local Next.js 16.2.11 guides `01-app/01-getting-started/03-layouts-and-pages.md`, `01-app/01-getting-started/04-linking-and-navigating.md`, and `01-app/03-api-reference/04-functions/use-pathname.md` before editing.
- Preserve `apps/platform/src/app/(app)/layout.tsx` as the server-side authentication boundary; pathname state belongs in a nested Client Component.
- Use `next/link` for internal destinations so shared layouts persist and routes prefetch.
- Use semantic tokens for neutral and functional colors; do not add raw `zinc-*` utilities.
- The functional palette is limited to brand, bug/risk, information, success, warning, danger, and neutral.
- Primary navigation uses the shared SVG icon family; emoji remain allowed only in friendly educational copy.
- Desktop exposes Home, Learn, Practice, Community, Profile, and More; mobile exposes Home, Learn, Practice, Community, and Profile.
- All primary touch controls have at least a 44-by-44 CSS-pixel interaction box.
- Any motion introduced here must use semantic durations and must become effectively static under `prefers-reduced-motion: reduce`.
- Do not edit `packages/ui/src/dropdown-menu.tsx`, accessibility state components, note files, simulator files, portfolio files, community media files, workflow files, migrations, dependency manifests, or `pnpm-lock.yaml` in this lane.
- This lane owns `packages/ui/src/index.ts` until its integration commit. Lane B supplies its additional exports to the integration governor after this lane lands.
- Do not regenerate visual baselines outside `mcr.microsoft.com/playwright:v1.60.0-noble`; baseline changes require a human screenshot review before commit.
- Each task must leave lint, typecheck, and its focused tests green and must commit only the files listed for that task.

## File Map and Ownership

**Lane-owned existing files**

- `apps/platform/src/app/globals.css` — semantic color, spacing, radius, elevation, and motion tokens.
- `apps/platform/test/design-tokens.test.ts` — mechanical token and palette rules.
- `packages/ui/src/index.ts` — Lane A's single export integration point.
- `packages/ui/test/ui.test.tsx` — static semantic contracts for shared primitives.
- `apps/platform/src/app/(app)/layout.tsx` — server authorization and `AppShell` composition.
- `apps/platform/src/app/(app)/dashboard/components/hub-grid.tsx` — SVG icon migration and Knowledge Base copy.
- `apps/platform/src/components/nav/avatar-menu.tsx` — three-state theme selector integration.
- `apps/platform/src/components/motion.tsx` — semantic motion constants.
- `e2e/tests/hub-nav.spec.ts` — adaptive-shell journey.
- `e2e/tests/visual.spec.ts-snapshots/dashboard-*.png` — reviewed dashboard baselines only.

**Lane-owned new files**

- `packages/ui/src/icon.tsx` — dependency-free, consistent SVG icon family.
- `packages/ui/src/field.tsx` — Field, Input, Textarea, Select, Checkbox, RadioGroup, and FormMessage.
- `packages/ui/src/navigation.tsx` — Tabs, SegmentedControl, Breadcrumbs, and Pagination.
- `packages/ui/src/overlay.tsx` — controlled Dialog, Drawer, BottomSheet, Popover, and Tooltip shells.
- `packages/ui/src/feedback.tsx` — Progress, Stat, ToastRegion, and responsive record display.
- `packages/ui/src/page-layout.tsx` — index, detail, editor, and dashboard templates.
- `packages/ui/test/design-system.test.tsx` — markup and API contract tests.
- `apps/platform/src/components/nav/navigation-model.ts` — route groups, active-state matching, breadcrumbs, and searchable commands.
- `apps/platform/src/components/nav/navigation-model.test.ts` — pure route-model tests.
- `apps/platform/src/components/nav/app-shell.tsx` — adaptive application frame.
- `apps/platform/src/components/nav/navigation-rail.tsx` — desktop primary navigation.
- `apps/platform/src/components/nav/mobile-navigation.tsx` — mobile primary navigation.
- `apps/platform/src/components/nav/app-breadcrumbs.tsx` — pathname-derived context.
- `apps/platform/src/components/nav/theme-selector.tsx` — Light, Dark, and System control.
- `apps/platform/src/components/nav/command-palette.tsx` — keyboard-accessible route finder.
- `apps/platform/src/components/nav/recent-destinations.ts` — bounded local navigation history.
- `apps/platform/src/components/nav/recent-destinations.test.ts` — history reducer tests.
- `apps/platform/src/components/celebration/celebration-provider.tsx` — one celebration policy and rendering boundary.
- `apps/platform/src/components/celebration/celebration-policy.ts` — intensity, repetition, and reduced-motion rules.
- `apps/platform/src/components/celebration/celebration-policy.test.ts` — pure policy tests.
- `apps/platform/src/app/(app)/design-system/page.tsx` — authenticated component gallery.
- `e2e/tests/app-shell.spec.ts` — desktop, mobile, command, active-route, and theme coverage.

**Integration boundaries**

- Lane B may modify `apps/platform/src/app/(app)/layout.tsx` only after this lane's shell commit is integrated, to add the skip target and final landmark sweep.
- Lane B owns `packages/ui/src/dropdown-menu.tsx` and new async-state primitives. The governor appends Lane B exports to `packages/ui/src/index.ts` after both lanes are green.
- This lane's `packages/ui/src/button.tsx` token/variant change must integrate before Lane B's touch-target/focus-ring change (Task 7); Lane B rebases onto this lane's integrated copy rather than its pre-integration checkpoint.
- Lane C owns all files under `(app)/notes`, `(app)/simulator`, and `(app)/portfolio`; it consumes the page templates only after this plan's package commit lands.

---

### Task 1: Govern Semantic Tokens and the Functional Palette

**Files:**
- Modify: `apps/platform/src/app/globals.css`
- Modify: `apps/platform/test/design-tokens.test.ts`
- Modify: `packages/ui/src/badge.tsx`
- Modify: `packages/ui/src/button.tsx`
- Modify: `packages/ui/src/card.tsx`

**Interfaces:**
- Consumes: existing `:root`, `.dark`, and `@theme inline` semantic tokens.
- Produces: CSS properties `--space-page-x`, `--space-page-y`, `--space-card`, `--radius-control`, `--radius-card`, `--radius-panel`, `--shadow-card`, `--shadow-overlay`, `--motion-instant`, `--motion-fast`, `--motion-standard`, `--motion-emphasis`, `--motion-educational`, `--ease-enter`, `--ease-exit`, `--ease-move`, `--success`, `--warning`, `--info`, and `--danger` in both themes.

- [ ] **Step 1: Add a failing token-contract test**

Append this test to `apps/platform/test/design-tokens.test.ts`:

```ts
describe("design-system foundations", () => {
  const required = [
    "space-page-x", "space-page-y", "space-card",
    "radius-control", "radius-card", "radius-panel",
    "shadow-card", "shadow-overlay",
    "motion-instant", "motion-fast", "motion-standard",
    "motion-emphasis", "motion-educational",
    "ease-enter", "ease-exit", "ease-move",
    "success", "warning", "info", "danger",
  ];

  it("defines every spacing, depth, motion, and functional-color token", () => {
    for (const token of required) {
      expect(css, `missing --${token}`).toMatch(new RegExp(`--${token}:\\s*[^;]+;`));
    }
  });

  it("does not add ungoverned category color names", () => {
    expect(css).not.toMatch(/--(?:violet|cyan|sky|rose|teal)-category:/);
  });
});
```

- [ ] **Step 2: Run the focused test and observe the missing-token failure**

Run: `pnpm --filter @qa-mastery/platform test -- test/design-tokens.test.ts`

Expected: FAIL with `missing --space-page-x` and the remaining new tokens.

- [ ] **Step 3: Define exact light and dark functional colors**

Add to `:root`:

```css
  --success: #0f8a6d;
  --warning: #b45309;
  --info: #0369a1;
  --danger: #b91c1c;
```

Add to `.dark`:

```css
  --success: #34d399;
  --warning: #f5b948;
  --info: #38bdf8;
  --danger: #f87171;
```

- [ ] **Step 4: Define exact spacing, depth, and motion tokens once in `:root`**

```css
  --space-page-x: clamp(1rem, 2vw, 2.5rem);
  --space-page-y: clamp(1.5rem, 3vw, 2.5rem);
  --space-card: clamp(1rem, 1.5vw, 1.5rem);
  --radius-control-value: 0.5rem;
  --radius-card-value: 1rem;
  --radius-panel-value: 1.25rem;
  --shadow-card-value: 0 1px 2px rgb(0 0 0 / 0.08), 0 12px 32px -24px rgb(0 0 0 / 0.35);
  --shadow-overlay-value: 0 24px 80px -28px rgb(0 0 0 / 0.55);
  --motion-instant: 80ms;
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --motion-emphasis: 320ms;
  --motion-educational: 600ms;
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --ease-move: cubic-bezier(0.2, 0, 0, 1);
```

- [ ] **Step 5: Register functional colors, radii, and shadows in `@theme inline`**

```css
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --color-danger: var(--danger);
  --radius-control: var(--radius-control-value);
  --radius-card: var(--radius-card-value);
  --radius-panel: var(--radius-panel-value);
  --shadow-card: var(--shadow-card-value);
  --shadow-overlay: var(--shadow-overlay-value);
```

- [ ] **Step 6: Run token tests and platform verification**

Before verification, replace Badge tone classes with semantic functional tokens:

```ts
const TONE_CLASSES: Record<Tone, string> = {
  default: "border-border text-foreground",
  success: "border-success/40 bg-success/10 text-success-text",
  warning: "border-warning/40 bg-warning/10 text-warning-text",
  info: "border-info/40 bg-info/10 text-info-text",
  danger: "border-danger/40 bg-danger/10 text-danger-text",
};
```

Change shared controls to `rounded-control` and cards to `rounded-card shadow-card`; preserve button variant behavior and Card's `interactive` prop.

Run: `pnpm --filter @qa-mastery/platform test -- test/design-tokens.test.ts && pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/platform lint`

Expected: PASS; no undefined semantic color or raw zinc report.

- [ ] **Step 7: Commit the token contract**

```bash
git add apps/platform/src/app/globals.css apps/platform/test/design-tokens.test.ts packages/ui/src/badge.tsx packages/ui/src/button.tsx packages/ui/src/card.tsx
git commit -m "feat(ui): govern visual and motion tokens"
```

### Task 2: Add the Shared SVG Icon Family

**Files:**
- Create: `packages/ui/src/icon.tsx`
- Create: `packages/ui/test/design-system.test.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `IconName = "home" | "learn" | "practice" | "community" | "profile" | "more" | "code" | "book" | "portfolio" | "checklist" | "tasks" | "talent" | "bell" | "settings" | "sun" | "moon" | "system" | "search" | "close" | "chevron-right" | "download" | "copy" | "reset" | "fullscreen"` and `Icon({ name, size?, decorative?, label?, className? })`.
- Accessibility contract: decorative icons set `aria-hidden="true"`; informative icons require `label` and render `role="img" aria-label={label}`.

- [ ] **Step 1: Write the failing icon markup tests**

Create `packages/ui/test/design-system.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "../src/index";

describe("Icon", () => {
  it("hides a decorative SVG from assistive technology", () => {
    const html = renderToStaticMarkup(<Icon name="home" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('viewBox="0 0 24 24"');
  });

  it("labels an informative SVG", () => {
    const html = renderToStaticMarkup(
      <Icon name="bell" decorative={false} label="Unread notifications" />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Unread notifications"');
  });
});
```

- [ ] **Step 2: Run the test and observe the missing export failure**

Run: `pnpm --filter @qa-mastery/ui test -- test/design-system.test.tsx`

Expected: FAIL because `Icon` is not exported.

- [ ] **Step 3: Implement the typed icon registry**

Create `packages/ui/src/icon.tsx` with one `<path>` or `<circle>/<line>` group per `IconName`, all using `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.8}`, `strokeLinecap="round"`, and `strokeLinejoin="round"`. Use this exact public component contract:

```tsx
import type { SVGAttributes } from "react";
import { cn } from "./cn";

export type IconName =
  | "home" | "learn" | "practice" | "community" | "profile" | "more"
  | "code" | "book" | "portfolio" | "checklist" | "tasks" | "talent"
  | "bell" | "settings" | "sun" | "moon" | "system" | "search" | "close"
  | "chevron-right" | "download" | "copy" | "reset" | "fullscreen";

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  decorative?: boolean;
  label?: string;
}

export function Icon({
  name,
  size = 20,
  decorative = true,
  label,
  className,
  ...props
}: IconProps) {
  if (!decorative && !label) throw new Error("Informative icons require a label");
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      className={cn("shrink-0", className)}
      {...props}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
```

Define `ICON_PATHS` as `Record<IconName, React.ReactNode>` in the same file; do not accept arbitrary SVG markup or external icon URLs.

- [ ] **Step 4: Export the icon contract**

Append to `packages/ui/src/index.ts`:

```ts
export { Icon, type IconName, type IconProps } from "./icon";
```

- [ ] **Step 5: Run package tests and typecheck**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck`

Expected: PASS, including both icon semantics.

- [ ] **Step 6: Commit the icon family**

```bash
git add packages/ui/src/icon.tsx packages/ui/src/index.ts packages/ui/test/design-system.test.tsx
git commit -m "feat(ui): add shared svg icon family"
```

### Task 3: Add Shared Form Controls

**Files:**
- Create: `packages/ui/src/field.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/test/design-system.test.tsx`

**Interfaces:**
- Produces: `Field({ label, htmlFor, hint?, error?, required?, children })`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `RadioOption`, and `FormMessage`.
- `Field` links hint/error text with `aria-describedby`; error uses `role="alert"`; controls forward native props and refs.

- [ ] **Step 1: Add failing form-semantic tests**

```tsx
import { Field, Input, Textarea, Select } from "../src/index";

it("connects a field label, hint, and error to its control", () => {
  const html = renderToStaticMarkup(
    <Field label="Display name" htmlFor="display-name" hint="Shown publicly" error="Required">
      <Input id="display-name" aria-invalid />
    </Field>,
  );
  expect(html).toContain('for="display-name"');
  expect(html).toContain('aria-describedby="display-name-hint display-name-error"');
  expect(html).toContain('role="alert"');
});

it("gives textareas and selects the shared 44px control floor", () => {
  expect(renderToStaticMarkup(<Textarea aria-label="Notes" />)).toContain("min-h-11");
  expect(renderToStaticMarkup(<Select aria-label="Track"><option>API</option></Select>)).toContain("min-h-11");
});
```

- [ ] **Step 2: Run the package test and observe missing exports**

Run: `pnpm --filter @qa-mastery/ui test -- test/design-system.test.tsx`

Expected: FAIL because the form controls are not exported.

- [ ] **Step 3: Implement native-prop-forwarding controls**

Use `forwardRef` and these shared classes in `packages/ui/src/field.tsx`:

```tsx
const CONTROL =
  "min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";
```

`Field` must clone its one control child to merge `aria-describedby` with any caller-provided value. `Checkbox` and `RadioOption` must retain native `<input type="checkbox">` and `<input type="radio">` semantics instead of recreating them with `div` roles.

- [ ] **Step 4: Export the form controls**

```ts
export {
  Field, Input, Textarea, Select, Checkbox, RadioGroup, RadioOption, FormMessage,
  type FieldProps,
} from "./field";
```

- [ ] **Step 5: Run UI verification**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck`

Expected: PASS; generated markup contains native labels and controls.

- [ ] **Step 6: Commit shared form controls**

```bash
git add packages/ui/src/field.tsx packages/ui/src/index.ts packages/ui/test/design-system.test.tsx
git commit -m "feat(ui): add accessible form primitives"
```

### Task 4: Add Navigation, Feedback, and Page-Layout Primitives

**Files:**
- Create: `packages/ui/src/navigation.tsx`
- Create: `packages/ui/src/feedback.tsx`
- Create: `packages/ui/src/page-layout.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/test/design-system.test.tsx`

**Interfaces:**
- Produces: controlled `Tabs<T>`, `SegmentedControl<T>`, `Breadcrumbs`, `Pagination`, `Progress`, `Stat`, `ToastRegion`, `ResponsiveRecords`, `PageContainer`, `PageHeader`, `IndexPage`, `DetailPage`, `EditorPage`, and `DashboardPage`.
- `ResponsiveRecords<T>` consumes `{ items, getKey, renderCard, renderRow, headers }` and renders cards below `md` plus a semantic table at `md` and above.

- [ ] **Step 1: Add failing markup contracts**

```tsx
import { Breadcrumbs, Progress, PageHeader, ResponsiveRecords } from "../src/index";

it("renders an accessible breadcrumb and current page", () => {
  const html = renderToStaticMarkup(
    <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Practice" }]} />,
  );
  expect(html).toContain('aria-label="Breadcrumb"');
  expect(html).toContain('aria-current="page"');
});

it("exposes progress numerically", () => {
  const html = renderToStaticMarkup(<Progress value={35} max={100} label="Course progress" />);
  expect(html).toContain('role="progressbar"');
  expect(html).toContain('aria-valuenow="35"');
});

it("gives each page header one h1", () => {
  const html = renderToStaticMarkup(<PageHeader eyebrow="Practice" title="Simulator" />);
  expect(html.match(/<h1/g)).toHaveLength(1);
});
```

- [ ] **Step 2: Run tests and observe missing exports**

Run: `pnpm --filter @qa-mastery/ui test -- test/design-system.test.tsx`

Expected: FAIL on the first missing primitive export.

- [ ] **Step 3: Implement controlled navigation primitives**

`Tabs<T extends string>` and `SegmentedControl<T extends string>` use real buttons, `aria-selected`/`role="tab"` for tabs, `aria-pressed` for segmented choices, and receive `value`, `items`, and `onValueChange`. Do not keep a second internal selected state.

- [ ] **Step 4: Implement feedback and responsive records**

`ToastRegion` renders `role="region" aria-label="Notifications" aria-live="polite"`; each toast has a stable ID and optional dismiss button. `Progress` clamps values to `0..max`. `ResponsiveRecords` requires callers to supply the exact mobile-card and desktop-row content so data remains identical across breakpoints.

- [ ] **Step 5: Implement the four page templates**

Use `PageContainer` for spacing, `PageHeader` for route title and actions, and composition-only wrappers:

```tsx
export function EditorPage({ header, editor, output }: {
  header: ReactNode;
  editor: ReactNode;
  output: ReactNode;
}) {
  return (
    <PageContainer size="wide">
      {header}
      <div className="grid gap-4 lg:grid-cols-2">{editor}{output}</div>
    </PageContainer>
  );
}
```

`IndexPage`, `DetailPage`, and `DashboardPage` follow the same composition rule and do not fetch data or read routing state.

- [ ] **Step 6: Export every public type and component**

Add explicit exports from `navigation`, `feedback`, and `page-layout` to `packages/ui/src/index.ts`; do not use `export *`.

- [ ] **Step 7: Run UI package verification**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck`

Expected: PASS with native landmark, heading, table, and progress markup.

- [ ] **Step 8: Commit primitives and templates**

```bash
git add packages/ui/src/navigation.tsx packages/ui/src/feedback.tsx packages/ui/src/page-layout.tsx packages/ui/src/index.ts packages/ui/test/design-system.test.tsx
git commit -m "feat(ui): add navigation feedback and page templates"
```

### Task 5: Add Controlled Overlay Primitives

**Files:**
- Create: `packages/ui/src/overlay.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/test/design-system.test.tsx`

**Interfaces:**
- Produces: `Dialog`, `Drawer`, `BottomSheet`, `Popover`, and `Tooltip` with controlled `open`, `onOpenChange`, labelled title/description IDs, Escape close, outside-pointer close, initial-focus ref, and focus return.
- Lane B later supplies interaction-level Testing Library verification and may correct behavior while preserving these public props.

- [ ] **Step 1: Add failing open-state semantic tests**

```tsx
import { Dialog, Tooltip } from "../src/index";

it("renders a labelled modal dialog only while open", () => {
  const closed = renderToStaticMarkup(
    <Dialog open={false} onOpenChange={() => {}} title="Delete report">Body</Dialog>,
  );
  const open = renderToStaticMarkup(
    <Dialog open onOpenChange={() => {}} title="Delete report" description="Cannot be undone">Body</Dialog>,
  );
  expect(closed).toBe("");
  expect(open).toContain('role="dialog"');
  expect(open).toContain('aria-modal="true"');
  expect(open).toContain("Delete report");
});

it("connects tooltip content with aria-describedby", () => {
  const html = renderToStaticMarkup(<Tooltip content="Run code"><button>Run</button></Tooltip>);
  expect(html).toContain("aria-describedby");
  expect(html).toContain('role="tooltip"');
});
```

- [ ] **Step 2: Run tests and observe missing exports**

Run: `pnpm --filter @qa-mastery/ui test -- test/design-system.test.tsx`

Expected: FAIL because `Dialog` and `Tooltip` are absent.

- [ ] **Step 3: Implement one shared overlay controller**

In `overlay.tsx`, create a private `useOverlayDismiss({ open, onOpenChange, triggerRef, panelRef })` hook. On open, remember `document.activeElement`, focus `initialFocusRef.current ?? panelRef.current`, close on Escape or a pointer outside, and return focus on cleanup. Keep `Dialog`, `Drawer`, and `BottomSheet` as separate visual wrappers over this hook.

- [ ] **Step 4: Implement non-modal popover and tooltip semantics**

`Popover` uses a caller-supplied trigger and controlled open state; it does not set `aria-modal`. `Tooltip` opens on focus and hover, closes on blur and pointer leave, and never contains interactive descendants.

- [ ] **Step 5: Export overlay components and types**

```ts
export {
  Dialog, Drawer, BottomSheet, Popover, Tooltip,
  type DialogProps, type PopoverProps, type TooltipProps,
} from "./overlay";
```

- [ ] **Step 6: Run package verification**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck`

Expected: PASS; closed modal produces no markup and open modal is labelled.

- [ ] **Step 7: Commit controlled overlays**

```bash
git add packages/ui/src/overlay.tsx packages/ui/src/index.ts packages/ui/test/design-system.test.tsx
git commit -m "feat(ui): add controlled overlay primitives"
```

### Task 6: Create the Single Navigation Model

**Files:**
- Create: `apps/platform/src/components/nav/navigation-model.ts`
- Create: `apps/platform/src/components/nav/navigation-model.test.ts`

**Interfaces:**
- Consumes: `IconName` from `@qa-mastery/ui`.
- Produces: `NavDestination`, `NavGroup`, `PRIMARY_MOBILE_IDS`, `getNavigation(showTalent)`, `isDestinationActive(pathname, destination)`, `getBreadcrumbItems(pathname)`, and `searchDestinations(query, showTalent)`.

- [ ] **Step 1: Write the route-model regression tests**

Create `navigation-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getNavigation,
  getBreadcrumbItems,
  isDestinationActive,
  searchDestinations,
} from "./navigation-model";

describe("navigation model", () => {
  it("defines six desktop groups and five stable mobile destinations", () => {
    const nav = getNavigation(false);
    expect(nav.groups.map((group) => group.label)).toEqual([
      "Home", "Learn", "Practice", "Community", "Profile", "More",
    ]);
    expect(nav.mobile.map((item) => item.label)).toEqual([
      "Home", "Learn", "Practice", "Community", "Profile",
    ]);
  });

  it("matches descendants without marking sibling destinations active", () => {
    const knowledge = getNavigation(false).destinations.find((item) => item.id === "knowledge-base")!;
    expect(isDestinationActive("/notes/api-testing/http", knowledge)).toBe(true);
    expect(isDestinationActive("/simulator", knowledge)).toBe(false);
  });

  it("builds route context for a nested Knowledge Base topic", () => {
    expect(getBreadcrumbItems("/notes/api-testing/http/status-codes")).toEqual([
      { label: "Home", href: "/dashboard" },
      { label: "Knowledge Base", href: "/notes" },
      { label: "Api Testing", href: "/notes/api-testing" },
      { label: "Http", href: "/notes/api-testing/http" },
      { label: "Status Codes" },
    ]);
  });

  it("searches labels, descriptions, and keywords", () => {
    expect(searchDestinations("compiler", false).map((item) => item.id)).toContain("simulator");
  });
});
```

- [ ] **Step 2: Run the focused test and observe the missing module failure**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/nav/navigation-model.test.ts`

Expected: FAIL because `navigation-model.ts` does not exist.

- [ ] **Step 3: Define the exact destination contract**

```ts
import type { IconName } from "@qa-mastery/ui";

export type NavGroupId = "home" | "learn" | "practice" | "community" | "profile" | "more";

export interface NavDestination {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: IconName;
  group: NavGroupId;
  keywords: readonly string[];
  match: readonly string[];
  mobile?: boolean;
  feature?: "talent";
}

export interface NavGroup {
  id: NavGroupId;
  label: string;
  icon: IconName;
  items: NavDestination[];
}
```

- [ ] **Step 4: Populate the canonical route registry**

Use these destination IDs and routes: `home:/dashboard`, `learning-paths:/dashboard#tracks`, `knowledge-base:/notes`, `simulator:/simulator`, `buggy-api:/buggyapi/report`, `test-cases:/test-cases`, `tasks:/tasks`, `community:/community`, `portfolio:/portfolio/me`, `settings:/settings`, and feature-gated `talent:/talent`. Mobile group links resolve to `/dashboard`, `/notes`, `/simulator`, `/community`, and `/portfolio/me`.

- [ ] **Step 5: Implement deterministic matching and breadcrumb humanization**

Match exact paths or `${prefix}/`; never use `pathname.startsWith("/note")` without a segment boundary. Decode each dynamic segment, replace hyphens with spaces, and title-case it. The current breadcrumb item has no `href`.

- [ ] **Step 6: Run route-model tests and platform typecheck**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/nav/navigation-model.test.ts && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS with deterministic groups, active state, breadcrumb labels, and search.

- [ ] **Step 7: Commit the navigation model**

```bash
git add apps/platform/src/components/nav/navigation-model.ts apps/platform/src/components/nav/navigation-model.test.ts
git commit -m "feat(platform): define application navigation model"
```

### Task 7: Build and Integrate the Adaptive Application Shell

**Files:**
- Create: `apps/platform/src/components/nav/navigation-rail.tsx`
- Create: `apps/platform/src/components/nav/mobile-navigation.tsx`
- Create: `apps/platform/src/components/nav/app-breadcrumbs.tsx`
- Create: `apps/platform/src/components/nav/app-shell.tsx`
- Modify: `apps/platform/src/app/(app)/layout.tsx`
- Modify: `apps/platform/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/platform/src/app/(app)/dashboard/buggyapi-card.tsx`
- Modify: `apps/platform/src/app/(app)/dashboard/components/hub-grid.tsx`
- Modify: `apps/platform/src/app/(app)/dashboard/components/role-panels.tsx`
- Modify: `e2e/tests/hub-nav.spec.ts`
- Create: `e2e/tests/app-shell.spec.ts`

**Interfaces:**
- `AppShell` consumes `{ userId: string; email: string; initialUnread: number; showTalent: boolean; children: ReactNode }`.
- `NavigationRail` and `MobileNavigation` consume the output of `getNavigation(showTalent)` plus `pathname`.
- `AppBreadcrumbs` consumes `pathname` and calls `getBreadcrumbItems`.

- [ ] **Step 1: Replace the obsolete minimal-header assertion with failing adaptive-shell checks**

In `hub-nav.spec.ts`, change the test description and assert that desktop navigation contains direct `Knowledge Base`, `Coding simulator`, `Community`, and `Portfolio` links. Add `app-shell.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

test.describe("adaptive application shell", () => {
  test("desktop rail shows direct destinations and active location", async ({ page }) => {
    await signUpFreshLearner(page, "shell-desktop");
    await page.goto("http://localhost:3000/simulator");
    const rail = page.getByRole("navigation", { name: "Primary" });
    await expect(rail.getByRole("link", { name: "Coding simulator" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Practice");
  });

  test("mobile exposes five stable destinations with 44px targets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signUpFreshLearner(page, "shell-mobile");
    const mobile = page.getByRole("navigation", { name: "Mobile primary" });
    await expect(mobile.getByRole("link")).toHaveCount(5);
    for (const link of await mobile.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });
});
```

- [ ] **Step 2: Run the two shell specs and observe missing navigation failures**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/hub-nav.spec.ts tests/app-shell.spec.ts --project=chromium`

Expected: FAIL because the current header exposes only Dashboard and no primary rail or mobile navigation.

- [ ] **Step 3: Implement the desktop rail**

Render `<aside className="hidden md:flex">` and `<nav aria-label="Primary">`. Each `Link` uses a shared 44px row, an `Icon`, text label, and `aria-current="page"` when active. Keep group headings visible; collapse to icon-only rail between `md` and `xl` with an accessible label retained.

- [ ] **Step 4: Implement the mobile bottom navigation**

Render a fixed, safe-area-aware `<nav aria-label="Mobile primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">`. Each of five links uses `min-h-11 min-w-11`, icon plus label, and active state. Add `padding-bottom: calc(4rem + env(safe-area-inset-bottom))` to the mobile content region.

- [ ] **Step 5: Implement breadcrumb context**

Use `usePathname()` only inside `AppBreadcrumbs`, pass `getBreadcrumbItems(pathname)` to the shared `Breadcrumbs`, and render it above `children`. Hide only the single-item Home breadcrumb on `/dashboard`.

- [ ] **Step 6: Compose the client shell**

`AppShell` reads `usePathname()`, renders the rail, a compact header with brand/bell/avatar, breadcrumbs, the content region, and the mobile nav. Keep `HelpAgentProvider`, `HelpAgentWidget`, and `FeedbackWidget` inside the authenticated frame without changing their behavior.

- [ ] **Step 7: Preserve the server auth boundary in `layout.tsx`**

Keep `createSupabaseServerClient()`, `getUser()`, `redirect("/login")`, and `getUnreadCount()` in the Server Component. Replace only the returned markup:

```tsx
return (
  <AppShell
    userId={user.id}
    email={user.email ?? ""}
    initialUnread={unread}
    showTalent={talentEnabled()}
  >
    {children}
  </AppShell>
);
```

- [ ] **Step 8: Replace dashboard hub emoji and color dialects**

Change `HubCard.icon` to `IconName`, map the six cards to `community`, `code`, `book`, `portfolio`, `checklist`, and `tasks`, and replace per-category `chip` classes with `bg-accent/10 text-accent` or the governed functional tones. Rename `Notes wiki` to `Knowledge Base` without changing `/notes`, and change dashboard summary copy from `notes across`/`notes complete` to `topics across`/`topics complete`. In dashboard, BuggyAPI card, and role panels, map cyan/sky/violet treatments to `border-info/25 bg-info/[0.05] text-info-text`, talent/success to `border-success/25 bg-success/[0.05] text-success-text`, and bug-risk emphasis to warning tokens.

- [ ] **Step 9: Run focused unit, lint, type, and Chromium shell tests**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/nav/navigation-model.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/hub-nav.spec.ts tests/app-shell.spec.ts --project=chromium`

Expected: PASS; desktop direct navigation, current-page semantics, breadcrumbs, and five mobile destinations are visible.

- [ ] **Step 10: Commit the adaptive shell**

```bash
git add apps/platform/src/components/nav apps/platform/src/app/'(app)'/layout.tsx apps/platform/src/app/'(app)'/dashboard/page.tsx apps/platform/src/app/'(app)'/dashboard/buggyapi-card.tsx apps/platform/src/app/'(app)'/dashboard/components/hub-grid.tsx apps/platform/src/app/'(app)'/dashboard/components/role-panels.tsx e2e/tests/hub-nav.spec.ts e2e/tests/app-shell.spec.ts
git commit -m "feat(platform): add adaptive application navigation"
```

### Task 8: Expose Light, Dark, and System Theme Selection

**Files:**
- Create: `apps/platform/src/components/nav/theme-selector.tsx`
- Modify: `apps/platform/src/components/nav/avatar-menu.tsx`
- Modify: `e2e/tests/app-shell.spec.ts`

**Interfaces:**
- Consumes: `theme`, `setTheme`, and `resolvedTheme` from `next-themes`.
- Produces: `ThemeSelector` with choices `light`, `dark`, and `system`, using `aria-pressed` and the shared `sun`, `moon`, and `system` icons.

- [ ] **Step 1: Add the failing System-theme journey**

```ts
test("account settings expose Light, Dark, and System theme choices", async ({ page }) => {
  await signUpFreshLearner(page, "shell-theme");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dark theme" })).toBeVisible();
  await page.getByRole("button", { name: "System theme" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("system");
});
```

- [ ] **Step 2: Run the test and observe the missing System control**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/app-shell.spec.ts --project=chromium --grep "System theme"`

Expected: FAIL because the current avatar menu exposes only a binary mode toggle.

- [ ] **Step 3: Implement the explicit theme selector**

Render three buttons in a labelled group. Use the persisted `theme` value for `aria-pressed`, not `resolvedTheme`, because a system preference may resolve to light or dark while still remaining in System mode.

```tsx
const OPTIONS = [
  { id: "light", label: "Light theme", icon: "sun" },
  { id: "dark", label: "Dark theme", icon: "moon" },
  { id: "system", label: "System theme", icon: "system" },
] as const;
```

- [ ] **Step 4: Replace the avatar menu's binary emoji toggle**

Remove `isDark` and the `☀️/🌙` label. Render `<ThemeSelector />` between Settings and the final separator. Preserve Profile, Settings, and Sign out behavior.

- [ ] **Step 5: Run the theme journey in Chromium and WebKit**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/app-shell.spec.ts --grep "System theme"`

Expected: PASS in both projects; local storage contains `system` after selection.

- [ ] **Step 6: Commit the three-state theme control**

```bash
git add apps/platform/src/components/nav/theme-selector.tsx apps/platform/src/components/nav/avatar-menu.tsx e2e/tests/app-shell.spec.ts
git commit -m "feat(platform): expose system theme preference"
```

### Task 9: Add the Authenticated Component Gallery

**Files:**
- Create: `apps/platform/src/app/(app)/design-system/page.tsx`
- Modify: `e2e/tests/app-shell.spec.ts`

**Interfaces:**
- Consumes: every Lane A `@qa-mastery/ui` primitive.
- Produces: `/design-system`, an authenticated visual QA route with metadata title `Design system` and sections for palette, typography, controls, navigation, overlays, feedback, and page templates.

- [ ] **Step 1: Add a failing gallery smoke assertion**

```ts
test("component gallery renders every foundation section", async ({ page }) => {
  await signUpFreshLearner(page, "shell-gallery");
  await page.goto("http://localhost:3000/design-system");
  for (const heading of ["Palette", "Typography", "Controls", "Navigation", "Overlays", "Feedback", "Page templates"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
```

- [ ] **Step 2: Run the smoke assertion and observe the 404**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/app-shell.spec.ts --project=chromium --grep "component gallery"`

Expected: FAIL because `/design-system` does not exist.

- [ ] **Step 3: Build the gallery from real components**

Use `PageContainer` and `PageHeader`. Render all functional tones against both `bg-surface` and `bg-surface-raised`; render enabled, disabled, invalid, loading, and focused-control examples; keep interactive overlay examples in a nested Client Component named `gallery-client.tsx` rather than making the entire page client-rendered.

- [ ] **Step 4: Run platform and gallery verification**

Run: `pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/app-shell.spec.ts --project=chromium --grep "component gallery"`

Expected: PASS with every named section visible.

- [ ] **Step 5: Commit the component gallery**

```bash
git add apps/platform/src/app/'(app)'/design-system e2e/tests/app-shell.spec.ts
git commit -m "feat(platform): add authenticated component gallery"
```

### Task 10: Add Command Navigation and Recent Destinations

**Files:**
- Create: `apps/platform/src/components/nav/recent-destinations.ts`
- Create: `apps/platform/src/components/nav/recent-destinations.test.ts`
- Create: `apps/platform/src/components/nav/command-palette.tsx`
- Modify: `apps/platform/src/components/nav/app-shell.tsx`
- Modify: `e2e/tests/app-shell.spec.ts`

**Interfaces:**
- Produces: `RecentDestination = { id: string; href: string; label: string; visitedAt: number }`, `recordRecentDestination(history, destination, now, limit = 5)`, `readRecentDestinations(storage)`, and `writeRecentDestinations(storage, history)` under key `qa-mastery:recent-destinations:v1`.
- Command palette opens with `Cmd+K` or `Ctrl+K`, filters `searchDestinations`, lists recent destinations for an empty query, and routes using `router.push`.

- [ ] **Step 1: Write failing bounded-history tests**

```ts
import { describe, expect, it } from "vitest";
import { recordRecentDestination } from "./recent-destinations";

describe("recent destination history", () => {
  it("deduplicates by id, newest first, and keeps five entries", () => {
    let history = [];
    for (let i = 0; i < 7; i += 1) {
      history = recordRecentDestination(history, { id: `id-${i}`, href: `/p/${i}`, label: `Page ${i}` }, i);
    }
    history = recordRecentDestination(history, { id: "id-4", href: "/p/4", label: "Page 4" }, 10);
    expect(history).toHaveLength(5);
    expect(history[0].id).toBe("id-4");
    expect(new Set(history.map((item) => item.id)).size).toBe(5);
  });
});
```

- [ ] **Step 2: Run the reducer test and observe the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/nav/recent-destinations.test.ts`

Expected: FAIL because the history module is absent.

- [ ] **Step 3: Implement pure history and defensive storage parsing**

Reject parsed entries that lack string `id`, `href`, `label`, or numeric `visitedAt`. A malformed stored JSON value returns `[]` and never throws during shell hydration.

- [ ] **Step 4: Add the failing command-palette browser journey**

```ts
test("command palette searches and opens a direct destination", async ({ page }) => {
  await signUpFreshLearner(page, "shell-command");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Navigate" });
  await dialog.getByRole("combobox", { name: "Search destinations" }).fill("compiler");
  await dialog.getByRole("option", { name: /Coding simulator/ }).click();
  await expect(page).toHaveURL(/\/simulator$/);
});
```

- [ ] **Step 5: Run the journey and observe the missing dialog**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/app-shell.spec.ts --project=chromium --grep "command palette"`

Expected: FAIL because no Navigate dialog opens.

- [ ] **Step 6: Implement keyboard, filtering, and route history**

Open on `metaKey || ctrlKey` plus `k`, ignore the shortcut while an input/textarea/select is active, close on Escape, and expose results as `role="listbox"`/`role="option"`. On each pathname change, resolve the closest destination and record it. Never store query text, user IDs, or arbitrary URLs.

- [ ] **Step 7: Run focused and full shell verification**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/nav/navigation-model.test.ts src/components/nav/recent-destinations.test.ts && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/app-shell.spec.ts --project=chromium`

Expected: PASS; keyboard search routes and recent history remains bounded.

- [ ] **Step 8: Commit command navigation**

```bash
git add apps/platform/src/components/nav/recent-destinations.ts apps/platform/src/components/nav/recent-destinations.test.ts apps/platform/src/components/nav/command-palette.tsx apps/platform/src/components/nav/app-shell.tsx e2e/tests/app-shell.spec.ts
git commit -m "feat(platform): add command and recent navigation"
```

### Task 11: Centralize Motion and Celebration Policy

**Files:**
- Create: `apps/platform/src/components/celebration/celebration-policy.ts`
- Create: `apps/platform/src/components/celebration/celebration-policy.test.ts`
- Create: `apps/platform/src/components/celebration/celebration-provider.tsx`
- Modify: `apps/platform/src/components/motion.tsx`
- Modify: `apps/platform/src/components/nav/app-shell.tsx`

**Interfaces:**
- Produces: `CelebrationIntensity = "subtle" | "standard" | "milestone"`, `CelebrationRequest = { id: string; intensity: CelebrationIntensity }`, `shouldCelebrate({ enabled, reducedMotion, lastId, requestId })`, and context `useCelebration().celebrate(request)`.
- Preferences are client-only in Wave 2 and default to enabled; Wave 3 profile settings may persist the explicit user choice without changing this API.

- [ ] **Step 1: Write failing policy tests**

```ts
import { describe, expect, it } from "vitest";
import { shouldCelebrate } from "./celebration-policy";

describe("celebration policy", () => {
  it("blocks disabled, reduced-motion, and repeated requests", () => {
    expect(shouldCelebrate({ enabled: false, reducedMotion: false, lastId: null, requestId: "a" })).toBe(false);
    expect(shouldCelebrate({ enabled: true, reducedMotion: true, lastId: null, requestId: "a" })).toBe(false);
    expect(shouldCelebrate({ enabled: true, reducedMotion: false, lastId: "a", requestId: "a" })).toBe(false);
  });

  it("allows one new request when motion is permitted", () => {
    expect(shouldCelebrate({ enabled: true, reducedMotion: false, lastId: "a", requestId: "b" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the policy test and observe the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/celebration/celebration-policy.test.ts`

Expected: FAIL because the policy module is absent.

- [ ] **Step 3: Implement the pure policy and semantic Motion constants**

Export `MOTION` from `motion.tsx`:

```ts
export const MOTION = {
  instant: 0.08,
  fast: 0.12,
  standard: 0.2,
  emphasis: 0.32,
  educational: 0.6,
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  move: [0.2, 0, 0, 1] as const,
};
```

Change frequent authenticated-route `Reveal` duration from `0.6` to `MOTION.standard`; retain `MOTION.educational` for lesson-step animations only.

- [ ] **Step 4: Implement one provider-owned celebration surface**

The provider uses `useReducedMotion()`, one last-request ID ref, and a single fixed `aria-hidden` visual layer. `subtle` renders 8 particles, `standard` 16, and `milestone` 28. Do not create arbitrary DOM nodes or play sound.

- [ ] **Step 5: Mount the provider once in `AppShell`**

Wrap authenticated children with `<CelebrationProvider>` inside `HelpAgentProvider`; do not alter server authorization or realtime behavior.

- [ ] **Step 6: Run policy, platform, and reduced-motion verification**

Run: `pnpm --filter @qa-mastery/platform test -- src/components/celebration/celebration-policy.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS; duplicate and reduced-motion requests are suppressed.

- [ ] **Step 7: Commit shared motion governance**

```bash
git add apps/platform/src/components/celebration apps/platform/src/components/motion.tsx apps/platform/src/components/nav/app-shell.tsx
git commit -m "feat(platform): centralize motion and celebrations"
```

### Task 12: Complete Cross-Browser and Visual Verification

**Files:**
- Modify only after review: `e2e/tests/visual.spec.ts-snapshots/dashboard-dark-chromium-linux.png`
- Modify only after review: `e2e/tests/visual.spec.ts-snapshots/dashboard-dark-webkit-linux.png`
- Modify only after review: `e2e/tests/visual.spec.ts-snapshots/dashboard-light-chromium-linux.png`
- Modify only after review: `e2e/tests/visual.spec.ts-snapshots/dashboard-light-webkit-linux.png`

**Interfaces:**
- Consumes: completed Lane A shell and design system.
- Produces: focused test evidence and reviewed pinned-environment dashboard baselines.

- [ ] **Step 1: Confirm the lane touched only owned paths**

Run: `git diff --name-only HEAD~11..HEAD`

Expected: only the Lane A paths enumerated in this plan; no workflow, migration, note, simulator, portfolio, dropdown, manifest, or lockfile change.

- [ ] **Step 2: Run package and platform verification**

Run: `pnpm --filter @qa-mastery/ui test && pnpm --filter @qa-mastery/ui typecheck && pnpm --filter @qa-mastery/platform test && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: all commands exit 0.

- [ ] **Step 3: Build the platform production bundle**

Run: `pnpm --filter @qa-mastery/platform build`

Expected: exit 0; `/design-system`, `/dashboard`, `/notes`, and `/simulator` appear in the route output without hydration or server/client-boundary errors.

- [ ] **Step 4: Run shell journeys in Chromium and WebKit**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/hub-nav.spec.ts tests/app-shell.spec.ts`

Expected: PASS in both projects.

- [ ] **Step 5: Generate candidate dashboard baselines in the pinned image**

Run from the repository root:

```bash
docker run --rm -v "$PWD:/work" -w /work mcr.microsoft.com/playwright:v1.60.0-noble \
  bash -lc 'corepack enable && pnpm install --frozen-lockfile && pnpm --filter @qa-mastery/platform build && pnpm --filter @qa-mastery/buggyshop build && pnpm --filter @qa-mastery/e2e exec playwright test tests/visual.spec.ts --update-snapshots'
```

Expected: the homepage baselines remain unchanged; four dashboard baseline candidates reflect the rail and governed icon system.

- [ ] **Step 6: Inspect all four candidate images before staging them**

Verify that the desktop rail is visible, active states are readable in both themes, no content is clipped, and the mobile bar does not appear in desktop snapshots. If any condition fails, fix the implementation and regenerate; do not raise the pixel tolerance.

- [ ] **Step 7: Run the visual suite against the reviewed candidates**

Run the same pinned-container command without `--update-snapshots`.

Expected: PASS for homepage and dashboard in Chromium and WebKit.

- [ ] **Step 8: Commit only reviewed baseline changes**

```bash
git add e2e/tests/visual.spec.ts-snapshots/dashboard-*-linux.png
git commit -m "test(visual): accept adaptive shell baselines"
```

## Lane Handoff Evidence

Before handing the lane to the integration governor, record:

```text
Base commit:
Head commit:
Owned-path diff:
UI tests:
Platform tests:
Lint:
Typecheck:
Production build:
Chromium shell:
WebKit shell:
Visual pinned-container run:
Human baseline reviewer:
Known follow-up seam: Lane B appends async-state exports and performs interaction-level accessibility tests.
```
