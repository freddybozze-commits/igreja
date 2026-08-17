-- Execute uma vez no Supabase: SQL Editor > New query > Run.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  birth_date date,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(), title text not null, subtitle text,
  category text, image text, date text, published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  starts_at timestamptz, location text, image text, published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(), title text not null,
  image text, route text not null default 'ministries', sort_order integer not null default 0,
  published boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  name text not null, phone text, request text not null, is_private boolean not null default true,
  status text not null default 'received', created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.highlights enable row level security;
alter table public.prayer_requests enable row level security;

create policy "Public can read posts" on public.posts for select using (published = true);
create policy "Public can read events" on public.events for select using (published = true);
create policy "Public can read highlights" on public.highlights for select using (published = true);
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Anyone can send prayer request" on public.prayer_requests for insert with check (user_id is null or auth.uid() = user_id);
create policy "Users read own requests" on public.prayer_requests for select using (auth.uid() = user_id);

-- Retorna verdadeiro somente para usuários autenticados promovidos a administrador.
-- SECURITY DEFINER evita recursão nas políticas da tabela profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Usuários podem editar apenas dados pessoais; o campo role fica fora do alcance do navegador.
revoke insert, update on public.profiles from authenticated;
grant insert (id, full_name, phone, birth_date, created_at, updated_at) on public.profiles to authenticated;
grant update (full_name, phone, birth_date, updated_at) on public.profiles to authenticated;

create policy "Admins read all profiles" on public.profiles for select using (public.is_admin());
create policy "Admins manage posts" on public.posts for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage events" on public.events for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage highlights" on public.highlights for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage prayer requests" on public.prayer_requests for all using (public.is_admin()) with check (public.is_admin());

-- Bucket público: qualquer visitante pode ver as imagens, mas apenas admins podem alterá-las.
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = excluded.public;

create policy "Public reads content images" on storage.objects
for select using (bucket_id = 'content-images');
create policy "Admins upload content images" on storage.objects
for insert to authenticated with check (bucket_id = 'content-images' and public.is_admin());
create policy "Admins update content images" on storage.objects
for update to authenticated using (bucket_id = 'content-images' and public.is_admin()) with check (bucket_id = 'content-images' and public.is_admin());
create policy "Admins delete content images" on storage.objects
for delete to authenticated using (bucket_id = 'content-images' and public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
