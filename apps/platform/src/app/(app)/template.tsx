import { Reveal } from "@/components/motion";
import { RouteFocusHeading } from "@/components/route-focus";

/**
 * Page-transition wrapper for the authenticated shell. Unlike layout.tsx,
 * a template remounts on every navigation (Next.js file convention), so the
 * mount-fade in Reveal replays on each page change instead of running once —
 * and RouteFocusHeading's effect re-runs per route for the same reason,
 * moving focus to the page's <h1> (WCAG 2.4.3). y=8 keeps the fade subtle for
 * frequent in-app navigation; Reveal already honors prefers-reduced-motion.
 * This wraps every (app) route's content, so it's the actual above-the-fold
 * gate for dashboard/learn/notes/talent/community — fade={false} keeps
 * content visible at first paint (see
 * docs/known-issues/dashboard-blank-first-paint.md).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <Reveal y={8} fade={false}>
      <RouteFocusHeading />
      {children}
    </Reveal>
  );
}
