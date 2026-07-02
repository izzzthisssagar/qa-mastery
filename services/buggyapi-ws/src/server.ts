import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import { verifyWsToken, type WsClaims } from "./auth.js";

/**
 * BuggyAPI WebSocket practice service — the realtime leg of the TaskFlight
 * curriculum. Runs as a tiny standalone Node process on Fly.io (Vercel
 * serverless can't hold sockets; free Fly machines sleep, so the first
 * connection may take a few seconds — that cold start is itself a lesson).
 *
 * Endpoints (auth: `?token=<ba-session JWT>` query param — the browser
 * WebSocket API can't set headers, so token-in-query is the practical
 * pattern; the token is the 24h sandbox session from /enter):
 *
 *  - /ws/echo           — frames come back verbatim, prefixed `echo:`.
 *                         Send `ping` → `pong`. Teaches frames vs requests.
 *  - /ws/tickets-stream — pushes a JSON event whenever a ticket in YOUR
 *                         sandbox changes (service-role poll every 3s).
 *                         Mutate via REST/GraphQL, watch it arrive here.
 */

const PORT = Number(process.env.PORT ?? 8080);
const SECRET = process.env.SANDBOX_JWT_SECRET ?? "";
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const POLL_MS = 3000;

function db() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).schema("buggyapi");
}

const server = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "buggyapi-ws" }));
    return;
  }
  res.writeHead(426, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: {
        code: "upgrade_required",
        message: "This is a WebSocket service — connect to /ws/echo or /ws/tickets-stream.",
      },
    }),
  );
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", async (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const path = url.pathname;

  if (path !== "/ws/echo" && path !== "/ws/tickets-stream") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  const token = url.searchParams.get("token");
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  let claims: WsClaims;
  try {
    claims = await verifyWsToken(token, SECRET);
  } catch {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    if (path === "/ws/echo") handleEcho(ws);
    else handleTicketsStream(ws, claims);
  });
});

function handleEcho(ws: WebSocket) {
  ws.send(JSON.stringify({ type: "hello", endpoint: "echo", hint: "Send any frame; `ping` gets `pong`." }));
  ws.on("message", (data) => {
    const text = data.toString();
    ws.send(text === "ping" ? "pong" : `echo:${text}`);
  });
}

function handleTicketsStream(ws: WebSocket, claims: WsClaims) {
  let lastCheck = new Date().toISOString();
  let closed = false;

  ws.send(
    JSON.stringify({
      type: "hello",
      endpoint: "tickets-stream",
      sandbox_id: claims.sandboxId,
      hint: "Change a ticket via REST or GraphQL and watch the event arrive.",
    }),
  );

  const timer = setInterval(async () => {
    if (closed) return;
    try {
      const since = lastCheck;
      lastCheck = new Date().toISOString();
      const { data } = await db()
        .from("ba_tickets")
        .select("id, number, title, status, priority, updated_at")
        .eq("sandbox_id", claims.sandboxId)
        .gt("updated_at", since)
        .order("updated_at", { ascending: true })
        .limit(20);
      for (const ticket of data ?? []) {
        ws.send(JSON.stringify({ type: "ticket.changed", ticket }));
      }
    } catch {
      // Transient DB hiccup — next tick retries; the socket stays up.
    }
  }, POLL_MS);

  ws.on("close", () => {
    closed = true;
    clearInterval(timer);
  });
  ws.on("message", (data) => {
    if (data.toString() === "ping") ws.send("pong");
  });
}

server.listen(PORT, () => {
  console.log(`buggyapi-ws listening on :${PORT}`);
});
