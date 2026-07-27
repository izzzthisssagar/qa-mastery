import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { resolveAuth, type Actor } from "@/api/auth";
import { buggyapiDb } from "@/api/db";

/**
 * TaskFlight GraphQL — the same sandbox data through a second paradigm.
 * Introspection and GraphiQL are open (schema exploration is the lesson);
 * every field resolver requires auth, using the exact same schemes as REST.
 * Auth errors use GraphQL's errors array with extensions.code=UNAUTHENTICATED
 * — contrasting REST's 401 envelope is part of the curriculum.
 */

interface GqlContext {
  auth: { ok: true; sandboxId: string; actor: Actor } | { ok: false; message: string };
}

function requireAuth(ctx: GqlContext): { sandboxId: string; actor: Actor } {
  if (!ctx.auth.ok) {
    throw new GraphQLError(ctx.auth.message, {
      extensions: { code: "UNAUTHENTICATED", http: { status: 200 } },
    });
  }
  return ctx.auth;
}

const typeDefs = /* GraphQL */ `
  type Query {
    "The authenticated principal — verify any auth scheme here."
    me: Me!
    "All projects in your sandbox."
    projects: [Project!]!
    "Tickets, optionally filtered."
    tickets(
      status: TicketStatus
      priority: TicketPriority
      projectId: ID
      first: Int = 20
    ): [Ticket!]!
    "One ticket by id."
    ticket(id: ID!): Ticket
  }

  type Mutation {
    "Create a ticket in a project."
    createTicket(input: CreateTicketInput!): Ticket!
    "Update a ticket's status."
    setTicketStatus(id: ID!, status: TicketStatus!): Ticket!
  }

  input CreateTicketInput {
    projectId: ID!
    title: String!
    description: String
    priority: TicketPriority = medium
    labels: [String!]
  }

  enum TicketStatus {
    open
    in_progress
    blocked
    done
    cancelled
  }
  enum TicketPriority {
    low
    medium
    high
    urgent
  }

  type Me {
    id: ID!
    name: String!
    email: String!
    role: String!
    authenticatedVia: String!
    sandboxId: ID!
  }

  type Project {
    id: ID!
    key: String!
    name: String!
    description: String
    status: String!
    tickets: [Ticket!]!
  }

  type Ticket {
    id: ID!
    ref: String!
    number: Int!
    title: String!
    description: String
    status: TicketStatus!
    priority: TicketPriority!
    labels: [String!]!
    project: Project!
  }
`;

const ticketRow =
  "id, project_id, number, title, description, status, priority, labels, ba_projects!inner(id, key, name, description, status)";

// TECH_DEBT: `row` is an untyped Supabase select() result with a joined
// ba_projects row; no generated row type for this shape yet. Tracked by
// docs/superpowers/plans/2026-07-26-release-repository-governance.md Task 5.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTicket(row: any) {
  return {
    id: row.id,
    ref: `${row.ba_projects.key}-${row.number}`,
    number: row.number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    labels: row.labels,
    project: row.ba_projects,
  };
}

const schema = createSchema<GqlContext>({
  typeDefs,
  resolvers: {
    Query: {
      me: (_p, _a, ctx) => {
        const { sandboxId, actor } = requireAuth(ctx);
        return {
          id: actor.id,
          name: actor.name,
          email: actor.email,
          role: actor.role,
          authenticatedVia: actor.via,
          sandboxId,
        };
      },
      projects: async (_p, _a, ctx) => {
        const { sandboxId } = requireAuth(ctx);
        const { data } = await buggyapiDb()
          .from("ba_projects")
          .select("id, key, name, description, status")
          .eq("sandbox_id", sandboxId)
          .order("created_at", { ascending: true });
        return data ?? [];
      },
      tickets: async (_p, args, ctx) => {
        const { sandboxId } = requireAuth(ctx);
        let q = buggyapiDb().from("ba_tickets").select(ticketRow).eq("sandbox_id", sandboxId);
        if (args.status) q = q.eq("status", args.status);
        if (args.priority) q = q.eq("priority", args.priority);
        if (args.projectId) q = q.eq("project_id", args.projectId);
        const { data } = await q
          .order("number", { ascending: true })
          .limit(Math.min(Math.max(args.first ?? 20, 1), 100));
        return (data ?? []).map(toTicket);
      },
      ticket: async (_p, args, ctx) => {
        const { sandboxId } = requireAuth(ctx);
        const { data } = await buggyapiDb()
          .from("ba_tickets")
          .select(ticketRow)
          .eq("sandbox_id", sandboxId)
          .eq("id", args.id)
          .maybeSingle();
        return data ? toTicket(data) : null;
      },
    },
    Mutation: {
      createTicket: async (_p, { input }, ctx) => {
        const { sandboxId } = requireAuth(ctx);
        const db = buggyapiDb();
        const { data: project } = await db
          .from("ba_projects")
          .select("id")
          .eq("sandbox_id", sandboxId)
          .eq("id", input.projectId)
          .maybeSingle();
        if (!project) {
          throw new GraphQLError(`Project ${input.projectId} does not exist.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        const { data: last } = await db
          .from("ba_tickets")
          .select("number")
          .eq("project_id", project.id)
          .order("number", { ascending: false })
          .limit(1)
          .maybeSingle();
        const { data, error } = await db
          .from("ba_tickets")
          .insert({
            sandbox_id: sandboxId,
            project_id: project.id,
            number: (last?.number ?? 0) + 1,
            title: input.title,
            description: input.description ?? null,
            priority: input.priority ?? "medium",
            labels: input.labels ?? [],
          })
          .select(ticketRow)
          .single();
        if (error) throw new GraphQLError(error.message);
        return toTicket(data);
      },
      setTicketStatus: async (_p, args, ctx) => {
        const { sandboxId } = requireAuth(ctx);
        const { data } = await buggyapiDb()
          .from("ba_tickets")
          .update({ status: args.status, updated_at: new Date().toISOString() })
          .eq("sandbox_id", sandboxId)
          .eq("id", args.id)
          .select(ticketRow)
          .maybeSingle();
        if (!data) {
          throw new GraphQLError(`Ticket ${args.id} does not exist.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        return toTicket(data);
      },
    },
    Project: {
      tickets: async (project, _a, ctx) => {
        const { sandboxId } = requireAuth(ctx);
        const { data } = await buggyapiDb()
          .from("ba_tickets")
          .select(ticketRow)
          .eq("sandbox_id", sandboxId)
          .eq("project_id", project.id)
          .order("number", { ascending: true });
        return (data ?? []).map(toTicket);
      },
    },
  },
});

const yoga = createYoga<GqlContext>({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  context: async ({ request }) => ({
    auth: await resolveAuth((name) => request.headers.get(name)),
  }),
});

// Wrapped so the exports match Next 16's route-handler signature exactly.
export async function GET(request: Request) {
  return yoga.handleRequest(request, {} as GqlContext);
}
export async function POST(request: Request) {
  return yoga.handleRequest(request, {} as GqlContext);
}
export async function OPTIONS(request: Request) {
  return yoga.handleRequest(request, {} as GqlContext);
}
