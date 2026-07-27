"use client";

import { useEffect, useState } from "react";

type Status = "reading" | "missing" | "exchanging" | "ready" | "error";

const SESSION_STORAGE_KEY = "ba-session";
const CREDS_STORAGE_KEY = "ba-credentials";

interface ExchangeResponse {
  sessionToken?: string;
  sandboxId?: string;
  apiKey?: string | null;
  users?: Array<{ name: string; email: string; password: string; role: string }>;
  oauthClient?: { client_id: string; client_secret: string; redirect_uri: string | null } | null;
  error?: string;
}

async function exchangeHandoffToken(token: string): Promise<ExchangeResponse> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const body = (await response.json().catch(() => ({}))) as ExchangeResponse;
  if (!response.ok || !body.sessionToken) {
    throw new Error(body.error ?? `Exchange failed (HTTP ${response.status})`);
  }
  return body;
}

/**
 * Sandbox handoff entry point. The platform opens
 *   /enter#t=<handoff-jwt>
 * (token in the URL FRAGMENT — it never reaches server logs or referrers).
 * Exchanges it at POST /api/session for a 24h session token + the sandbox's
 * practice credentials (API key, fake users), both kept in localStorage so
 * the docs landing page can display them.
 */
export default function EnterPage() {
  const [status, setStatus] = useState<Status>("reading");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
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
        const result = await exchangeHandoffToken(token);
        localStorage.setItem(SESSION_STORAGE_KEY, result.sessionToken!);
        localStorage.setItem(
          CREDS_STORAGE_KEY,
          JSON.stringify({
            sandboxId: result.sandboxId,
            apiKey: result.apiKey,
            users: result.users,
            oauthClient: result.oauthClient,
          }),
        );
        if (!cancelled) {
          setStatus("ready");
          window.location.replace("/");
        }
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
      <div data-testid="enter-status" className="max-w-md text-sm text-muted-foreground">
        {status === "reading" && <p>Reading your lab pass…</p>}
        {status === "exchanging" && <p>Provisioning your API sandbox…</p>}
        {status === "ready" && (
          <p className="font-medium text-api-accent">Sandbox ready — loading your API console.</p>
        )}
        {status === "missing" && (
          <p>
            No lab pass found. Open BuggyAPI from a lesson on the QA Mastery platform — it mints
            your sandbox access automatically.
          </p>
        )}
        {status === "error" && (
          <p className="text-red-400">Could not start your sandbox session: {detail}</p>
        )}
      </div>
    </main>
  );
}
