import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { createServiceClient } from "@qa-mastery/db";
import { buggyapiDb } from "./db";
import { ErrorSchema, IdParam } from "./schemas";
import type { AuthEnv } from "./auth";

/**
 * File-upload practice: multipart/form-data → private Storage bucket
 * (`buggyapi-uploads`, path-prefixed by sandbox) → short-lived signed URL.
 * Teaches multipart requests, size/type limits (413/415), and why private
 * files come back as expiring links instead of raw paths.
 */

const MAX_BYTES = 1024 * 1024; // matches the bucket's file_size_limit
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/pdf",
  "application/json",
]);
const SIGNED_URL_TTL_SECONDS = 10 * 60;

// Explicit type — inline literals infer a union that poisons createRoute's generics.
const SECURITY: Array<Record<string, string[]>> = [
  { ApiKeyAuth: [] },
  { BearerAuth: [] },
  { BasicAuth: [] },
];

const AttachmentSchema = z
  .object({
    id: z.uuid(),
    ticket_id: z.uuid(),
    file_name: z.string().openapi({ example: "repro-screenshot.png" }),
    content_type: z.string().openapi({ example: "image/png" }),
    size_bytes: z.number().int().openapi({ example: 48213 }),
    created_at: z.iso.datetime(),
    download_url: z.string().openapi({
      description: `Signed URL, valid ${SIGNED_URL_TTL_SECONDS / 60} minutes — private bucket, links expire.`,
    }),
  })
  .openapi("Attachment");

const uploadRow = "id, ticket_id, file_name, content_type, size_bytes, storage_path, created_at";

// TECH_DEBT: `row` is an untyped Supabase select() result; no generated row
// type for this shape yet. Tracked by docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 5.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withSignedUrl(row: any) {
  const storage = createServiceClient().storage.from("buggyapi-uploads");
  const { data } = await storage.createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
  const { storage_path: _dropped, ...rest } = row;
  return { ...rest, download_url: data?.signedUrl ?? "" };
}

export function registerAttachmentRoutes(app: OpenAPIHono<AuthEnv>) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/v1/tickets/{id}/attachments",
      tags: ["attachments"],
      summary: "Upload a file to a ticket (multipart/form-data)",
      description:
        `Field name \`file\`. Max ${MAX_BYTES / 1024} KB (413 beyond), allowed types: ` +
        `png, jpeg, txt, pdf, json (415 otherwise). Try: ` +
        "`curl -F file=@notes.txt -H 'X-API-Key: …' …/v1/tickets/<id>/attachments`.",
      security: SECURITY,
      request: {
        params: IdParam,
        body: {
          content: {
            "multipart/form-data": {
              schema: z
                .object({
                  file: z.any().openapi({ type: "string", format: "binary" }),
                })
                .openapi("AttachmentUpload"),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Uploaded.",
          content: { "application/json": { schema: AttachmentSchema } },
        },
        401: {
          description: "Not authenticated.",
          content: { "application/json": { schema: ErrorSchema } },
        },
        404: {
          description: "No such ticket.",
          content: { "application/json": { schema: ErrorSchema } },
        },
        413: {
          description: "File too large.",
          content: { "application/json": { schema: ErrorSchema } },
        },
        415: {
          description: "Unsupported content type.",
          content: { "application/json": { schema: ErrorSchema } },
        },
        422: {
          description: "No file field.",
          content: { "application/json": { schema: ErrorSchema } },
        },
        500: {
          description: "Internal error.",
          content: { "application/json": { schema: ErrorSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const sandboxId = c.get("sandboxId");
      const db = buggyapiDb();

      const { data: ticket } = await db
        .from("ba_tickets")
        .select("id")
        .eq("sandbox_id", sandboxId)
        .eq("id", id)
        .maybeSingle();
      if (!ticket) {
        return c.json(
          { error: { code: "not_found", message: `Ticket ${id} does not exist.` } },
          404,
        );
      }

      // The zod-openapi validator already parsed the multipart body.
      const { file } = c.req.valid("form") as { file: unknown };
      if (!(file instanceof File)) {
        return c.json(
          {
            error: {
              code: "validation_failed",
              message: "Send multipart/form-data with a `file` field.",
            },
          },
          422,
        );
      }
      if (file.size > MAX_BYTES) {
        return c.json(
          {
            error: {
              code: "payload_too_large",
              message: `Max file size is ${MAX_BYTES / 1024} KB.`,
            },
          },
          413,
        );
      }
      const contentType = file.type || "application/octet-stream";
      if (!ALLOWED_TYPES.has(contentType)) {
        return c.json(
          {
            error: {
              code: "unsupported_media_type",
              message: `Content type ${contentType} not allowed. Allowed: ${[...ALLOWED_TYPES].join(", ")}.`,
            },
          },
          415,
        );
      }

      const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 100) || "upload";
      const storagePath = `${sandboxId}/${crypto.randomUUID()}-${safeName}`;
      const storage = createServiceClient().storage.from("buggyapi-uploads");
      const { error: uploadError } = await storage.upload(storagePath, file, { contentType });
      if (uploadError) {
        return c.json({ error: { code: "internal", message: uploadError.message } }, 500);
      }

      const { data, error } = await db
        .from("ba_uploads")
        .insert({
          sandbox_id: sandboxId,
          ticket_id: id,
          file_name: safeName,
          content_type: contentType,
          size_bytes: file.size,
          storage_path: storagePath,
        })
        .select(uploadRow)
        .single();
      if (error) return c.json({ error: { code: "internal", message: error.message } }, 500);

      return c.json(await withSignedUrl(data), 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/v1/tickets/{id}/attachments",
      tags: ["attachments"],
      summary: "List a ticket's attachments (fresh signed URLs)",
      security: SECURITY,
      request: { params: IdParam },
      responses: {
        200: {
          description: "Attachments with freshly-signed download URLs.",
          content: { "application/json": { schema: z.array(AttachmentSchema) } },
        },
        401: {
          description: "Not authenticated.",
          content: { "application/json": { schema: ErrorSchema } },
        },
        404: {
          description: "No such ticket.",
          content: { "application/json": { schema: ErrorSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const sandboxId = c.get("sandboxId");
      const db = buggyapiDb();

      const { data: ticket } = await db
        .from("ba_tickets")
        .select("id")
        .eq("sandbox_id", sandboxId)
        .eq("id", id)
        .maybeSingle();
      if (!ticket) {
        return c.json(
          { error: { code: "not_found", message: `Ticket ${id} does not exist.` } },
          404,
        );
      }

      const { data } = await db
        .from("ba_uploads")
        .select(uploadRow)
        .eq("sandbox_id", sandboxId)
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      return c.json(await Promise.all((data ?? []).map(withSignedUrl)), 200);
    },
  );
}
