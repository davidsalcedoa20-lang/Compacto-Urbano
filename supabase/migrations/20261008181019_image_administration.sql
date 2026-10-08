-- Compacto Urbano: independent image administration schema.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.site_images (
  original_path text primary key check (original_path like '/%'),
  section text not null,
  alt text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.published_images (
  original_path text primary key references public.site_images(original_path) on delete cascade,
  storage_path text not null unique,
  alt text not null,
  published_by uuid not null references public.admins(user_id),
  published_at timestamptz not null default now()
);
create table if not exists public.image_changes (
  id bigint generated always as identity primary key,
  original_path text not null,
  action text not null check (action in ('published', 'restored')),
  previous_path text,
  new_path text,
  changed_by uuid not null references public.admins(user_id),
  changed_at timestamptz not null default now()
);

alter table public.admins enable row level security;
alter table public.site_images enable row level security;
alter table public.published_images enable row level security;
alter table public.image_changes enable row level security;

create policy "Administrators see their membership" on public.admins for select to authenticated using (user_id = (select auth.uid()));
create policy "Administrators read inventory" on public.site_images for select to authenticated using (exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators add inventory" on public.site_images for insert to authenticated with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators edit inventory" on public.site_images for update to authenticated using (exists (select 1 from public.admins where user_id = (select auth.uid()))) with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Anyone reads published images" on public.published_images for select to anon, authenticated using (true);
create policy "Administrators publish" on public.published_images for insert to authenticated with check (published_by = (select auth.uid()) and exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators update published" on public.published_images for update to authenticated using (exists (select 1 from public.admins where user_id = (select auth.uid()))) with check (published_by = (select auth.uid()) and exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators restore" on public.published_images for delete to authenticated using (exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators read history" on public.image_changes for select to authenticated using (exists (select 1 from public.admins where user_id = (select auth.uid())));

create schema if not exists private;
create or replace function private.record_image_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.image_changes (original_path, action, previous_path, new_path, changed_by)
  values (
    coalesce(new.original_path, old.original_path),
    case when tg_op = 'DELETE' then 'restored' else 'published' end,
    case when tg_op = 'INSERT' then null else old.storage_path end,
    case when tg_op = 'DELETE' then null else new.storage_path end,
    (select auth.uid())
  );
  return coalesce(new, old);
end;
$$;
revoke all on function private.record_image_change() from public, anon, authenticated;
create trigger image_change_log after insert or update or delete on public.published_images
for each row execute function private.record_image_change();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', false, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Administrators upload site images" on storage.objects for insert to authenticated
with check (bucket_id = 'site-images' and exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Published or admin image reads" on storage.objects for select to anon, authenticated
using (bucket_id = 'site-images' and (
  exists (select 1 from public.published_images where storage_path = name)
  or exists (select 1 from public.admins where user_id = (select auth.uid()))
));

grant usage on schema public to anon, authenticated;
grant select on public.published_images to anon, authenticated;
grant select on public.admins, public.site_images, public.image_changes to authenticated;
grant insert, update on public.site_images to authenticated;
grant insert, update, delete on public.published_images to authenticated;
