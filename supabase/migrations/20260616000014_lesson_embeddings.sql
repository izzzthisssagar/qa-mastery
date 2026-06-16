-- 0014 — curriculum RAG: embed lessons into pgvector so the tutor can retrieve
-- the most relevant lesson content for any question (grounded answers across
-- all 59 lessons, not just the open page).

create extension if not exists vector;

create table public.lesson_chunks (
  id uuid primary key default gen_random_uuid(),
  lesson_slug text not null,
  track text,
  module text,
  title text,
  chunk_index integer not null,
  content text not null,
  embedding vector(768), -- text-embedding-004 dimension (see EMBED_DIM)
  updated_at timestamptz not null default now(),
  unique (lesson_slug, chunk_index)
);

-- Curriculum content, NOT learner data — read server-side only via the service
-- role (the chat route). RLS on + no policies = deny-all to anon/authenticated;
-- grants come from migration 0004 default privileges.
alter table public.lesson_chunks enable row level security;

-- Cosine-distance ANN index for fast top-K retrieval.
create index lesson_chunks_embedding_idx
  on public.lesson_chunks
  using hnsw (embedding vector_cosine_ops);

create index lesson_chunks_slug_idx on public.lesson_chunks (lesson_slug);

-- Retrieval: top-N chunks by cosine similarity to a query embedding. Called by
-- the service role from the tutor's context builder.
create or replace function public.match_lesson_chunks(
  query_embedding vector(768),
  match_count integer default 6,
  min_similarity double precision default 0.5
)
returns table (
  lesson_slug text,
  title text,
  track text,
  module text,
  content text,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    lc.lesson_slug,
    lc.title,
    lc.track,
    lc.module,
    lc.content,
    1 - (lc.embedding <=> query_embedding) as similarity
  from public.lesson_chunks lc
  where lc.embedding is not null
    and 1 - (lc.embedding <=> query_embedding) >= min_similarity
  order by lc.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function
  public.match_lesson_chunks(vector, integer, double precision)
  from public, anon, authenticated;
