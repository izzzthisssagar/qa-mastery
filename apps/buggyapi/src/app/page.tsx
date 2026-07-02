"use client";

import { useEffect, useState } from "react";

interface Credentials {
  sandboxId?: string;
  apiKey?: string | null;
  users?: Array<{ name: string; email: string; password: string; role: string }>;
}

/**
 * BuggyAPI home — the learner's API console front door. Shows the sandbox
 * credentials captured during the /enter handoff (localStorage only; nothing
 * here is real identity) and links into the Swagger docs.
 */
export default function HomePage() {
  const [creds, setCreds] = useState<Credentials | null>(null);

  useEffect(() => {
    // Yield once so setState never fires synchronously inside the effect.
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem("ba-credentials");
        if (raw) setCreds(JSON.parse(raw) as Credentials);
      } catch {
        // Corrupt localStorage — treat as no handoff yet.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <p className="font-mono text-xs tracking-widest text-api-accent uppercase">BuggyAPI</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        TaskFlight — a live API you&apos;re allowed to break
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        A real, documented practice API. Send requests from curl, Postman, or the
        Swagger console below — everything you create lives in your own sandbox.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Hono-served route, not a Next page */}
        <a
          href="/api/docs"
          data-testid="open-docs"
          className="rounded-md bg-api-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Open API docs (Swagger)
        </a>
        <a
          href="/api/v1/openapi.json"
          className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-surface"
        >
          Raw OpenAPI 3.1 spec
        </a>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Your sandbox credentials</h2>
        {creds ? (
          <div data-testid="credentials" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Sandbox ID (X-Sandbox-Id header for Basic auth)</p>
              <code className="mt-1 block break-all font-mono text-sm">{creds.sandboxId}</code>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">API key (X-API-Key header)</p>
              <code data-testid="api-key" className="mt-1 block break-all font-mono text-sm">
                {creds.apiKey ?? "—"}
              </code>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Seeded users (Basic auth / POST /v1/auth/login)</p>
              <ul className="mt-2 space-y-1 font-mono text-sm">
                {(creds.users ?? []).map((u) => (
                  <li key={u.email}>
                    {u.email} / {u.password}{" "}
                    <span className="text-xs text-muted-foreground">({u.role})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Try it</p>
              <code className="mt-1 block break-all font-mono text-xs leading-relaxed">
                curl -H &quot;X-API-Key: {creds.apiKey ?? "<your-key>"}&quot;{" "}
                {typeof window === "undefined" ? "" : window.location.origin}
                /api/v1/tickets?status=open&amp;per_page=5
              </code>
            </div>
          </div>
        ) : (
          <p data-testid="no-credentials" className="mt-3 text-sm text-muted-foreground">
            No sandbox yet. Open BuggyAPI from a QA Mastery lesson — the handoff
            provisions your sandbox and your credentials appear here.
          </p>
        )}
      </section>
    </main>
  );
}
