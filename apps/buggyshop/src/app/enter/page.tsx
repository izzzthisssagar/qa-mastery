"use client";

import { useEffect, useState } from "react";

type Status = "reading" | "missing" | "exchanging" | "ready" | "error";

const SESSION_STORAGE_KEY = "bs-session";

async function exchangeHandoffToken(token: string): Promise<string> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    sessionToken?: string;
    error?: string;
  };
  if (!response.ok || !body.sessionToken) {
    throw new Error(body.error ?? `Exchange failed (HTTP ${response.status})`);
  }
  return body.sessionToken;
}

/**
 * Sandbox handoff entry point. The platform opens
 *   /enter#t=<handoff-jwt>
 * (token in the URL FRAGMENT — it never reaches server logs or referrers).
 * This page exchanges it at POST /api/session for a 24h session token kept in
 * localStorage. The exchange endpoint goes live in M1 with the sandboxes
 * table; until then it answers 501 and this page reports that honestly.
 */
export default function EnterPage() {
  const [status, setStatus] = useState<Status>("reading");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Yield once so state updates below never fire synchronously in the effect.
      await Promise.resolve();

      const fragment = window.location.hash.replace(/^#/, "");
      const token = new URLSearchParams(fragment).get("t");
      // Strip the fragment immediately so the token can't linger in the URL bar.
      window.history.replaceState(null, "", window.location.pathname);

      if (!token) {
        if (!cancelled) setStatus("missing");
        return;
      }

      if (!cancelled) setStatus("exchanging");
      try {
        const sessionToken = await exchangeHandoffToken(token);
        localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
        if (!cancelled) setStatus("ready");
      } catch (error: unknown) {
        if (!cancelled) {
          setDetail(error instanceof Error ? error.message : String(error));
          setStatus("error");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
      <div data-testid="enter-status" className="max-w-md text-sm text-zinc-600">
        {status === "reading" && <p>Reading your lab pass…</p>}
        {status === "exchanging" && <p>Setting up your sandbox session…</p>}
        {status === "ready" && (
          <p className="font-medium text-emerald-600">
            Sandbox ready — your lab will load here.
          </p>
        )}
        {status === "missing" && (
          <p>
            No lab pass found. Open BuggyShop from a lesson on the QA Mastery
            platform — it mints your sandbox access automatically.
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600">
            Could not start your sandbox session: {detail}
          </p>
        )}
      </div>
    </main>
  );
}
