import { Reveal } from "@/components/motion";

/**
 * Page-transition wrapper for the authenticated shell. Unlike layout.tsx,
 * a template remounts on every navigation (Next.js file convention), so the
 * mount-fade in Reveal replays on each page change instead of running once.
 * y=8 keeps it subtle for frequent in-app navigation; Reveal already honors
 * prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <Reveal y={8}>{children}</Reveal>;
}
