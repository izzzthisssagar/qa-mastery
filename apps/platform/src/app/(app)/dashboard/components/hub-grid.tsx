import Link from "next/link";

/**
 * The master hub grid — every destination that used to clutter the navbar now
 * lives here as a card. Any `soon` card renders disabled until its phase lands;
 * Talent is gated by the feature flag from the server.
 */

interface HubCard {
  href: string;
  label: string;
  desc: string;
  icon: string;
  accent: string;
  soon?: boolean;
}

export function HubGrid({ showTalent }: { showTalent: boolean }) {
  const cards: HubCard[] = [
    { href: "/community", label: "Community", desc: "Posts, questions & answers", icon: "💬", accent: "text-sky-400" },
    { href: "/simulator", label: "Coding simulator", desc: "Run code in 5 languages", icon: "⌨️", accent: "text-violet-400" },
    { href: "/notes", label: "Notes wiki", desc: "The QA reference library", icon: "📚", accent: "text-amber-400" },
    { href: "/portfolio/me", label: "Portfolio", desc: "Your public proof of work", icon: "🎯", accent: "text-emerald-400" },
    { href: "/test-cases", label: "Test cases", desc: "Author & manage test cases", icon: "✅", accent: "text-teal-400" },
    { href: "/tasks", label: "Tasks", desc: "Assigned practice & planner", icon: "🗂️", accent: "text-rose-400" },
  ];
  if (showTalent) {
    cards.push({ href: "/talent", label: "Talent", desc: "The QA marketplace", icon: "🧑‍💻", accent: "text-accent" });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) =>
        c.soon ? (
          <div
            key={c.label}
            data-testid={`hub-card-${c.label.toLowerCase().split(" ")[0]}`}
            aria-disabled
            className="flex cursor-not-allowed flex-col gap-1 rounded-2xl border border-border bg-surface/50 p-4 opacity-60"
          >
            <span className="text-xl" aria-hidden>{c.icon}</span>
            <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {c.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>
            </span>
            <span className="text-xs text-muted-foreground">{c.desc}</span>
          </div>
        ) : (
          <Link
            key={c.label}
            href={c.href}
            data-testid={`hub-card-${c.label.toLowerCase().split(" ")[0]}`}
            className="group flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
          >
            <span className="text-xl" aria-hidden>{c.icon}</span>
            <span className={`mt-1 text-sm font-semibold text-foreground`}>{c.label}</span>
            <span className="text-xs text-muted-foreground">{c.desc}</span>
          </Link>
        ),
      )}
    </div>
  );
}
