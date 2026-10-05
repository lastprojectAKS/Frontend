-- Fixed-window request counter used by Edge Functions to stop scripted abuse,
-- such as hammering payment creation. Only the server can read or change it.

create table public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         integer not null
);

alter table public.rate_limits enable row level security;

-- Returns true if the request is allowed, false if the caller is over the limit.
create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now    timestamptz := now();
  v_hits   integer;
begin
  insert into public.rate_limits (key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set window_start = case when public.rate_limits.window_start <= v_now - make_interval(secs => p_window_seconds)
                            then v_now else public.rate_limits.window_start end,
        hits         = case when public.rate_limits.window_start <= v_now - make_interval(secs => p_window_seconds)
                            then 1 else public.rate_limits.hits + 1 end
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
