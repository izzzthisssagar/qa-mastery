-- 0019 — talent mark-read RPC. talent_messages are immutable except read_at,
-- which the recipient flips. 0017 deliberately ships NO broad UPDATE policy on
-- the table; instead this security-definer RPC lets a participant mark the OTHER
-- party's messages as read, gated on auth.uid() participation. Granted to
-- authenticated (the function does its own participation check, so it's safe).

create or replace function public.talent_mark_read(conv uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.talent_conversations c
    where c.id = conv and (select auth.uid()) in (c.client_id, c.tester_id)
  ) then
    return;  -- not a participant → no-op
  end if;

  update public.talent_messages
    set read_at = now()
    where conversation_id = conv
      and sender_id <> (select auth.uid())
      and read_at is null;
end;
$$;

revoke all on function public.talent_mark_read(uuid) from public;
grant execute on function public.talent_mark_read(uuid) to authenticated;
