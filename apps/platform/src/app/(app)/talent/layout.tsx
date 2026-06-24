import { notFound } from "next/navigation";
import { talentEnabled } from "@/lib/talent/flag";

/**
 * Talent (marketplace) section. Ships dark behind TALENT_ENABLED — when off,
 * every /talent route 404s so the feature is invisible until rolled out
 * (DevOps-Spec §3.3). Auth is already enforced by the parent (app) layout.
 */
export default function TalentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!talentEnabled()) notFound();
  return <div className="mx-auto w-full max-w-5xl">{children}</div>;
}
