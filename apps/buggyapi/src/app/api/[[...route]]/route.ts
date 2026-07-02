import { handle } from "hono/vercel";
import { app } from "@/api";

/**
 * Hono catch-all under /api. Specific Next routes (/api/session, /api/health)
 * win over this optional catch-all; everything else — /api/v1/*, /api/docs —
 * is served by the Hono app.
 */
const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
