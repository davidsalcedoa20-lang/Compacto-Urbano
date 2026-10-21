-- Editable published sections for the Compacto Urbano site.
create table if not exists public.site_content (
  content_key text primary key check (content_key in ('hero', 'timeline', 'services', 'contact')),
  document jsonb not null check (jsonb_typeof(document) in ('array', 'object')),
  updated_by uuid not null references public.admins(user_id),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_changes (
  id bigint generated always as identity primary key,
  content_key text not null,
  previous_document jsonb,
  new_document jsonb not null,
  changed_by uuid not null references public.admins(user_id),
  changed_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.content_changes enable row level security;

create policy "Anyone reads published site content" on public.site_content
  for select to anon, authenticated using (true);
create policy "Administrators create site content" on public.site_content
  for insert to authenticated
  with check (updated_by = (select auth.uid()) and exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators update site content" on public.site_content
  for update to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (updated_by = (select auth.uid()) and exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Administrators read content history" on public.content_changes
  for select to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())));

create or replace function private.record_content_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.content_changes (content_key, previous_document, new_document, changed_by)
  values (new.content_key, case when tg_op = 'INSERT' then null else old.document end, new.document, new.updated_by);
  return new;
end;
$$;
revoke all on function private.record_content_change() from public, anon, authenticated;
create trigger content_change_log after insert or update on public.site_content
  for each row execute function private.record_content_change();

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
grant select on public.content_changes to authenticated;
