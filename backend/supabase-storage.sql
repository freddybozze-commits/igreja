-- Execute no SQL Editor do mesmo projeto Supabase usado pelo frontend.
-- Pode ser executado novamente sem duplicar o bucket ou as políticas.

-- Verifica a função do usuário sem causar recursão nas políticas de profiles.
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

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public reads content images" on storage.objects;
drop policy if exists "Admins upload content images" on storage.objects;
drop policy if exists "Admins update content images" on storage.objects;
drop policy if exists "Admins delete content images" on storage.objects;

create policy "Public reads content images" on storage.objects
for select using (bucket_id = 'content-images');

create policy "Admins upload content images" on storage.objects
for insert to authenticated
with check (bucket_id = 'content-images' and public.is_admin());

create policy "Admins update content images" on storage.objects
for update to authenticated
using (bucket_id = 'content-images' and public.is_admin())
with check (bucket_id = 'content-images' and public.is_admin());

create policy "Admins delete content images" on storage.objects
for delete to authenticated
using (bucket_id = 'content-images' and public.is_admin());
