import Link from "next/link";

/**
 * The master hub grid — every destination that used to clutter the navbar now
 * lives here as a card. Talent is gated by the feature flag from the server.
 */

interface HubCard {
  href: string;
  label: string;
  desc: string;
  icon: string;
  /** Icon-chip background tint. A background wash, not text color, on
   *  purpose: these are the raw Tailwind palette (not semantic tokens) for
   *  per-category variety, and none of them are AA-safe as text on the light
   *  surface this card sits on — only safe as a low-alpha background. */
  chip: string;
}

export function HubGrid({ showTalent }: { showTalent: boolean }) {
  const cards: HubCard[] = [
    { href: "/community", label: "Community", desc: "Posts, questions & answers", icon: "💬", chip: "bg-sky-500/12" },
    { href: "/simulator", label: "Coding simulator", desc: "Run code in 5 languages", icon: "⌨️", chip: "bg-violet-500/12" },
    { href: "/notes", label: "Notes wiki", desc: "The QA reference library", icon: "📚", chip: "bg-amber-500/12" },
    { href: "/portfolio/me", label: "Portfolio", desc: "Your public proof of work", icon: "🎯", chip: "bg-emerald-500/12" },
    { href: "/test-cases", label: "Test cases", desc: "Author & manage test cases", icon: "✅", chip: "bg-teal-500/12" },
    { href: "/tasks", label: "Tasks", desc: "Assigned practice & planner", icon: "🗂️", chip: "bg-rose-500/12" },
  ];
  if (showTalent) {
    cards.push({ href: "/talent", label: "Talent", desc: "The QA marketplace", icon: "🧑‍💻", chip: "bg-accent/12" });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          data-testid={`hub-card-${c.label.toLowerCase().split(" ")[0]}`}
          className="group flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
        >
          <span className={`grid size-9 place-items-center rounded-xl text-xl ${c.chip}`} aria-hidden>
            {c.icon}
          </span>
          <span className={`mt-1 text-sm font-semibold text-foreground`}>{c.label}</span>
          <span className="text-xs text-muted-foreground">{c.desc}</span>
        </Link>
      ))}
    </div>
  );
}
