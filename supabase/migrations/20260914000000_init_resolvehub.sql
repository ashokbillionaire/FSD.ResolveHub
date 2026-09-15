-- =============================================================================
-- ResolveHub — Smart Complaint Management System
-- Migration 0001: schema, constraints, indexes, triggers, RLS, storage, realtime
-- =============================================================================
-- Run this in the Supabase SQL Editor, or apply with:
--   supabase db push          (hosted project)
--   supabase db reset         (local stack)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        text not null default 'user'
                check (role in ('user', 'staff', 'admin')),
  is_active   boolean not null default true,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists avatar_url text;

comment on table public.profiles is 'Application profile for every auth.users row. role drives authorisation.';
comment on column public.profiles.role is 'user | staff | admin. Always defaults to user on registration.';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- -----------------------------------------------------------------------------
-- 2. categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. complaints
-- -----------------------------------------------------------------------------
create sequence if not exists public.complaint_number_seq as bigint start with 1;

create table if not exists public.complaints (
  id               uuid primary key default gen_random_uuid(),
  complaint_number text not null unique,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  category_id      uuid not null references public.categories (id) on delete restrict,
  assigned_to      uuid references public.profiles (id) on delete set null,
  title            text not null check (char_length(trim(title)) between 3 and 150),
  description      text not null check (char_length(trim(description)) between 10 and 5000),
  priority         text not null default 'Medium'
                     check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status           text not null default 'Submitted'
                     check (status in ('Submitted', 'Under Review', 'Assigned',
                                       'In Progress', 'Resolved', 'Closed', 'Rejected')),
  image_url        text,
  location         text,
  admin_remarks    text,
  resolution_notes text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  resolved_at      timestamptz,

  -- Internal ordering helpers. Priority and status are stored as readable
  -- text, so these generated columns give the database a semantic sort order
  -- (Critical → Low, Submitted → Closed) that PostgREST can paginate on.
  priority_rank integer not null generated always as (
    case priority
      when 'Critical' then 1
      when 'High'     then 2
      when 'Medium'   then 3
      else 4
    end
  ) stored,
  status_rank   integer not null generated always as (
    case status
      when 'Submitted'    then 1
      when 'Under Review' then 2
      when 'Assigned'     then 3
      when 'In Progress'  then 4
      when 'Resolved'     then 5
      when 'Closed'       then 6
      else 7
    end
  ) stored
);

create index if not exists complaints_user_idx        on public.complaints (user_id, created_at desc);
create index if not exists complaints_priority_rank_idx on public.complaints (priority_rank, created_at desc);
create index if not exists complaints_status_rank_idx   on public.complaints (status_rank, created_at desc);
create index if not exists complaints_status_idx      on public.complaints (status, created_at desc);
create index if not exists complaints_priority_idx    on public.complaints (priority, created_at desc);
create index if not exists complaints_category_idx    on public.complaints (category_id);
create index if not exists complaints_assigned_idx    on public.complaints (assigned_to, created_at desc);
create index if not exists complaints_search_idx      on public.complaints
  using gin (to_tsvector('english', title || ' ' || description));

-- -----------------------------------------------------------------------------
-- 4. complaint_status_history
-- -----------------------------------------------------------------------------
create table if not exists public.complaint_status_history (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  status       text not null,
  changed_by   uuid not null references public.profiles (id) on delete cascade,
  remarks      text,
  created_at   timestamptz not null default now()
);

create index if not exists status_history_complaint_idx
  on public.complaint_status_history (complaint_id, created_at asc);

-- -----------------------------------------------------------------------------
-- 5. feedback
-- -----------------------------------------------------------------------------
create table if not exists public.feedback (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null unique references public.complaints (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

create index if not exists feedback_user_idx on public.feedback (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 6. notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  complaint_id uuid references public.complaints (id) on delete cascade,
  title        text not null,
  message      text not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, is_read, created_at desc);

-- =============================================================================
-- 7. Helper functions (SECURITY DEFINER so policies never recurse into RLS)
-- =============================================================================
-- These read public.profiles as the function owner (postgres), which bypasses
-- RLS on the profiles table. That is what makes role checks safe inside
-- policies on profiles itself.

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.is_active
  );
$$;

create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'staff') and p.is_active
  );
$$;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin_or_staff() to authenticated;

-- =============================================================================
-- 8. Triggers
-- =============================================================================

-- 8.1 Keep updated_at fresh ------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 8.2 Auto-create a profile for every new auth user -------------------------
-- role is hard-coded to 'user' and is NEVER read from client-supplied
-- metadata, so self-registration can never mint an admin account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      initcap(split_part(new.email, '@', 1))
    ),
    new.email,
    'user'
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8.3 Generate the human-readable complaint number --------------------------
-- Runs on the server inside a BEFORE INSERT trigger, so the number is
-- authoritative even if the client sends nothing.
create or replace function public.generate_complaint_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.complaint_number is null or trim(new.complaint_number) = '' then
    new.complaint_number :=
      'CMP-' || lpad(nextval('public.complaint_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists complaints_generate_number on public.complaints;
create trigger complaints_generate_number
  before insert on public.complaints
  for each row execute function public.generate_complaint_number();

-- 8.4 Guard writes so the client can never be trusted ------------------------
--  * service role / internal jobs (auth.uid() is null) are allowed through,
--    because that key only ever lives on the server.
--  * admins may change anything.
--  * staff may only touch complaints assigned to them, and may not reassign.
--  * users may only edit their own complaint while it is still 'Submitted',
--    and may never touch status / assignment / remarks.
create or replace function public.guard_complaint_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.complaint_number is distinct from old.complaint_number
     or new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Immutable complaint fields cannot be modified';
  end if;

  if public.is_staff() then
    if old.assigned_to is distinct from auth.uid() then
      raise exception 'You can only update complaints assigned to you';
    end if;
    if new.assigned_to is distinct from old.assigned_to then
      raise exception 'Only administrators can assign complaints';
    end if;
    return new;
  end if;

  -- Regular user
  if new.status is distinct from old.status then
    raise exception 'You are not allowed to change the status of a complaint';
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    raise exception 'You are not allowed to assign complaints';
  end if;
  if new.admin_remarks is distinct from old.admin_remarks
     or new.resolution_notes is distinct from old.resolution_notes
     or new.resolved_at is distinct from old.resolved_at then
    raise exception 'You are not allowed to modify administrative fields';
  end if;
  if old.status <> 'Submitted' then
    raise exception 'This complaint can no longer be edited because it is already being processed';
  end if;

  return new;
end;
$$;

drop trigger if exists complaints_guard_update on public.complaints;
create trigger complaints_guard_update
  before update on public.complaints
  for each row execute function public.guard_complaint_update();

-- 8.5 Status history + notification on insert and status change -------------
create or replace function public.log_complaint_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  actor := coalesce(auth.uid(), new.user_id);

  if tg_op = 'INSERT' then
    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks)
    values (new.id, new.status, actor, 'Complaint submitted.');

    insert into public.notifications (user_id, complaint_id, title, message)
    values (
      new.user_id,
      new.id,
      'Complaint Submitted',
      'Your complaint ' || new.complaint_number || ' has been received and is awaiting review.'
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks)
    values (new.id, new.status, coalesce(auth.uid(), new.user_id), new.admin_remarks);

    insert into public.notifications (user_id, complaint_id, title, message)
    values (
      new.user_id,
      new.id,
      'Complaint Status Updated',
      'Your complaint ' || new.complaint_number || ' is now ' || new.status || '.'
    );

    if new.status = 'Resolved' and new.resolved_at is null then
      new.resolved_at := now();
    end if;
  end if;

  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    insert into public.notifications (user_id, complaint_id, title, message)
    values (
      new.user_id,
      new.id,
      'Complaint Assigned',
      'Your complaint ' || new.complaint_number || ' has been assigned to a staff member.'
    );
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists complaints_log_status on public.complaints;
create trigger complaints_log_status
  before insert or update on public.complaints
  for each row execute function public.log_complaint_status_change();

-- 8.6 Role / activation protection on profiles ------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only administrators can change roles';
  end if;
  if new.is_active is distinct from old.is_active then
    raise exception 'Only administrators can change account status';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be modified';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- 8.7 Notify the assignee when a complaint lands in their queue --------------
create or replace function public.notify_assignee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_to is not null
     and new.assigned_to is distinct from old.assigned_to then
    insert into public.notifications (user_id, complaint_id, title, message)
    values (
      new.assigned_to,
      new.id,
      'New Complaint Assigned',
      'Complaint ' || new.complaint_number || ' has been assigned to you.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists complaints_notify_assignee on public.complaints;
create trigger complaints_notify_assignee
  after update on public.complaints
  for each row execute function public.notify_assignee();

-- 8.8 Feedback is only allowed once a complaint is Resolved or Closed --------
create or replace function public.guard_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
begin
  select user_id, status into c from public.complaints where id = new.complaint_id;

  if c is null then
    raise exception 'Complaint not found';
  end if;
  if c.user_id <> new.user_id then
    raise exception 'You can only leave feedback on your own complaint';
  end if;
  if c.status not in ('Resolved', 'Closed') then
    raise exception 'Feedback can only be submitted once the complaint is resolved';
  end if;

  return new;
end;
$$;

drop trigger if exists feedback_guard_insert on public.feedback;
create trigger feedback_guard_insert
  before insert on public.feedback
  for each row execute function public.guard_feedback_insert();

-- =============================================================================
-- 9. Row Level Security
-- =============================================================================
alter table public.profiles                 enable row level security;
alter table public.categories               enable row level security;
alter table public.complaints               enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.feedback                 enable row level security;
alter table public.notifications            enable row level security;

-- Belt and braces: no anonymous access to any application table.
revoke all on public.profiles, public.categories, public.complaints,
  public.complaint_status_history, public.feedback, public.notifications
  from anon;

-- Signed-in users need table privileges before RLS can narrow them down.
-- (Supabase grants these by default; stating them explicitly keeps this
-- migration correct on a self-hosted or plain PostgreSQL instance too.)
grant select, insert, update, delete on public.profiles,
  public.categories, public.complaints, public.complaint_status_history,
  public.feedback, public.notifications to authenticated;

grant usage, select, update on all sequences in schema public to authenticated;
grant all on sequence public.complaint_number_seq to authenticated;
alter default privileges in schema public grant all on sequences to authenticated;

-- ------------------------------- profiles -----------------------------------
drop policy if exists "profiles: read own"      on public.profiles;
drop policy if exists "profiles: admin read all" on public.profiles;
drop policy if exists "profiles: staff read"     on public.profiles;
drop policy if exists "profiles: update own"     on public.profiles;
drop policy if exists "profiles: admin update"   on public.profiles;
drop policy if exists "profiles: insert own"     on public.profiles;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles: admin read all"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- Staff need the complainant's name/contact to action their assigned work.
create policy "profiles: staff read"
  on public.profiles for select to authenticated
  using (public.is_staff());

create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'user');

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin update"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------ categories ----------------------------------
drop policy if exists "categories: read all"  on public.categories;
drop policy if exists "categories: admin write" on public.categories;

create policy "categories: read all"
  on public.categories for select to authenticated
  using (true);

create policy "categories: admin write"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------ complaints ----------------------------------
drop policy if exists "complaints: read own"          on public.complaints;
drop policy if exists "complaints: staff read assigned" on public.complaints;
drop policy if exists "complaints: admin read all"    on public.complaints;
drop policy if exists "complaints: create own"        on public.complaints;
drop policy if exists "complaints: update own"        on public.complaints;
drop policy if exists "complaints: staff update assigned" on public.complaints;
drop policy if exists "complaints: admin update"      on public.complaints;
drop policy if exists "complaints: owner delete draft" on public.complaints;

create policy "complaints: read own"
  on public.complaints for select to authenticated
  using (user_id = auth.uid());

create policy "complaints: staff read assigned"
  on public.complaints for select to authenticated
  using (public.is_staff() and assigned_to = auth.uid());

create policy "complaints: admin read all"
  on public.complaints for select to authenticated
  using (public.is_admin());

create policy "complaints: create own"
  on public.complaints for insert to authenticated
  with check (user_id = auth.uid());

create policy "complaints: update own"
  on public.complaints for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "complaints: staff update assigned"
  on public.complaints for update to authenticated
  using (public.is_staff() and assigned_to = auth.uid())
  with check (public.is_staff() and assigned_to = auth.uid());

create policy "complaints: admin update"
  on public.complaints for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Only the owner, and only before anyone has started working on it.
create policy "complaints: owner delete draft"
  on public.complaints for delete to authenticated
  using (user_id = auth.uid() and status = 'Submitted');

-- ------------------------- complaint_status_history -------------------------
drop policy if exists "history: read own"           on public.complaint_status_history;
drop policy if exists "history: staff read assigned" on public.complaint_status_history;
drop policy if exists "history: admin read all"     on public.complaint_status_history;
drop policy if exists "history: admin write"        on public.complaint_status_history;

create policy "history: read own"
  on public.complaint_status_history for select to authenticated
  using (exists (
    select 1 from public.complaints c
    where c.id = complaint_status_history.complaint_id and c.user_id = auth.uid()
  ));

create policy "history: staff read assigned"
  on public.complaint_status_history for select to authenticated
  using (
    public.is_staff() and exists (
      select 1 from public.complaints c
      where c.id = complaint_status_history.complaint_id and c.assigned_to = auth.uid()
    )
  );

create policy "history: admin read all"
  on public.complaint_status_history for select to authenticated
  using (public.is_admin());

create policy "history: admin write"
  on public.complaint_status_history for insert to authenticated
  with check (public.is_admin());

-- -------------------------------- feedback ----------------------------------
drop policy if exists "feedback: read own"            on public.feedback;
drop policy if exists "feedback: staff read assigned" on public.feedback;
drop policy if exists "feedback: admin read all"      on public.feedback;
drop policy if exists "feedback: create own"          on public.feedback;

create policy "feedback: read own"
  on public.feedback for select to authenticated
  using (user_id = auth.uid());

create policy "feedback: staff read assigned"
  on public.feedback for select to authenticated
  using (
    public.is_staff() and exists (
      select 1 from public.complaints c
      where c.id = feedback.complaint_id and c.assigned_to = auth.uid()
    )
  );

create policy "feedback: admin read all"
  on public.feedback for select to authenticated
  using (public.is_admin());

create policy "feedback: create own"
  on public.feedback for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.complaints c
      where c.id = feedback.complaint_id
        and c.user_id = auth.uid()
        and c.status in ('Resolved', 'Closed')
    )
  );

-- ----------------------------- notifications --------------------------------
drop policy if exists "notifications: read own"    on public.notifications;
drop policy if exists "notifications: update own"  on public.notifications;
drop policy if exists "notifications: delete own"  on public.notifications;
drop policy if exists "notifications: admin insert" on public.notifications;

create policy "notifications: read own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications: update own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: delete own"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());

create policy "notifications: admin insert"
  on public.notifications for insert to authenticated
  with check (public.is_admin());

-- =============================================================================
-- 10. Storage bucket: complaint-images
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-images',
  'complaint-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored at  <user_id>/<uuid>.<ext>  so the first path segment
-- identifies the owner and can be enforced inside the policy.
drop policy if exists "complaint-images: public read"    on storage.objects;
drop policy if exists "complaint-images: owner upload"   on storage.objects;
drop policy if exists "complaint-images: owner update"   on storage.objects;
drop policy if exists "complaint-images: owner delete"   on storage.objects;

create policy "complaint-images: public read"
  on storage.objects for select
  using (bucket_id = 'complaint-images');

create policy "complaint-images: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "complaint-images: owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "complaint-images: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 10b. Storage bucket: avatars
-- -----------------------------------------------------------------------------
-- Profile pictures. Same ownership rule as complaint images: the first path
-- segment must be the uploader's user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: public read"  on storage.objects;
drop policy if exists "avatars: owner upload" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 11. Realtime
-- =============================================================================
-- Row Level Security is enforced for postgres_changes, so a subscriber only
-- ever receives rows their policies allow.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'complaints'
  ) then
    alter publication supabase_realtime add table public.complaints;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'complaint_status_history'
  ) then
    alter publication supabase_realtime add table public.complaint_status_history;
  end if;
exception
  when undefined_object then
    -- publication does not exist (self-hosted edge case) — realtime is optional
    null;
end $$;

-- Send the full previous row on UPDATE so the client can diff it.
alter table public.complaints               replica identity full;
alter table public.notifications            replica identity full;
alter table public.complaint_status_history replica identity full;

-- =============================================================================
-- 12. Analytics RPC — real numbers computed from real timestamps
-- =============================================================================
create or replace function public.admin_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Access denied: administrator role required';
  end if;

  select jsonb_build_object(
    'total_complaints',      (select count(*) from public.complaints),
    'by_status',             (select coalesce(jsonb_object_agg(s.status, s.cnt), '{}'::jsonb)
                                from (select status, count(*) cnt from public.complaints group by status) s),
    'by_priority',           (select coalesce(jsonb_object_agg(p.priority, p.cnt), '{}'::jsonb)
                                from (select priority, count(*) cnt from public.complaints group by priority) p),
    'by_category',           (select coalesce(jsonb_agg(jsonb_build_object(
                                        'category', c.name,
                                        'count',    coalesce(x.cnt, 0)
                                      ) order by c.name), '[]'::jsonb)
                                from public.categories c
                                left join (select category_id, count(*) cnt from public.complaints group by category_id) x
                                  on x.category_id = c.id),
    'critical_complaints',   (select count(*) from public.complaints where priority = 'Critical'),
    'high_complaints',       (select count(*) from public.complaints where priority = 'High'),
    'pending_complaints',    (select count(*) from public.complaints
                                where status in ('Submitted', 'Under Review', 'Assigned', 'In Progress')),
    'resolved_complaints',   (select count(*) from public.complaints where status = 'Resolved'),
    'closed_complaints',     (select count(*) from public.complaints where status = 'Closed'),
    'rejected_complaints',   (select count(*) from public.complaints where status = 'Rejected'),
    'resolution_rate',       (select case when count(*) = 0 then 0
                                     else round(
                                       (count(*) filter (where status in ('Resolved', 'Closed'))::numeric
                                        / count(*)::numeric) * 100, 1)
                                     end
                                from public.complaints),
    'avg_resolution_hours',  (select round(avg(extract(epoch from (resolved_at - created_at)) / 3600)::numeric, 1)
                                from public.complaints where resolved_at is not null),
    'avg_rating',            (select round(avg(rating)::numeric, 2) from public.feedback),
    'feedback_count',        (select count(*) from public.feedback),
    'total_users',           (select count(*) from public.profiles where role = 'user'),
    'total_staff',           (select count(*) from public.profiles where role = 'staff'),
    'avg_per_category',      (select case when (select count(*) from public.categories) = 0 then 0
                                     else round((select count(*)::numeric from public.complaints)
                                                / (select count(*)::numeric from public.categories), 2)
                                     end)
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_analytics() to authenticated;
