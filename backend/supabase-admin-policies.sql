-- Execute no SQL Editor do mesmo projeto usado pelo painel.
-- Este script pode ser executado novamente com segurança.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.prayer_requests enable row level security;

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image text,
  route text not null default 'ministries',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.highlights enable row level security;

grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.highlights to authenticated;
grant select, update, delete on public.prayer_requests to authenticated;

drop policy if exists "Admins manage posts" on public.posts;
drop policy if exists "Admins manage events" on public.events;
drop policy if exists "Admins manage prayer requests" on public.prayer_requests;
drop policy if exists "Public can read highlights" on public.highlights;
drop policy if exists "Admins manage highlights" on public.highlights;

create policy "Admins manage posts" on public.posts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage events" on public.events
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage prayer requests" on public.prayer_requests
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read highlights" on public.highlights
for select using (published = true);

create policy "Admins manage highlights" on public.highlights
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Resultado esperado para a conta que está logada no painel: role = admin.
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
order by u.email;
