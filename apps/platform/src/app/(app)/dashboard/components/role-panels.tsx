import Link from "next/link";

/**
 * Role-adaptive dashboard panels. The hub is a learner's home by default;
 * testers and clients (profiles.talent_role) get an extra panel pointing at
 * their side of the marketplace. `both` shows both. Rendered server-side from
 * the role the dashboard already fetched — no client branching.
 */

type Role = "none" | "tester" | "client" | "both";

function Panel({
  title,
  desc,
  href,
  cta,
  accent,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl border ${accent} p-5`}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Link
        href={href}
        className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}

export function RolePanels({ role, talentEnabled }: { role: Role; talentEnabled: boolean }) {
  if (!talentEnabled || role === "none") return null;

  const showTester = role === "tester" || role === "both";
  const showClient = role === "client" || role === "both";

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2" data-testid="role-panels">
      {showTester && (
        <Panel
          title="Your tester profile"
          desc="Keep your marketplace profile sharp and track your applications."
          href="/talent/profile"
          cta="Manage profile"
          accent="border-accent/25 bg-accent/[0.05]"
        />
      )}
      {showClient && (
        <Panel
          title="Your projects"
          desc="Review testers, manage projects, and read your inbox."
          href="/talent/projects"
          cta="Open projects"
          accent="border-sky-500/25 bg-sky-500/[0.05]"
        />
      )}
    </div>
  );
}
