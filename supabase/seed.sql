-- =============================================================================
-- ResolveHub — seed data
-- =============================================================================
-- Section 2 hashes the demo passwords with pgcrypto's crypt()/gen_salt(). On
-- Supabase those live in the `extensions` schema, so make sure it is on the
-- search path before this script runs.
set search_path to public, extensions;

-- Applied by `supabase db reset` (local) automatically.
-- On a hosted project you can paste sections of this file into the SQL Editor.
--
-- SECTION 1 (categories) is safe for production.
-- SECTION 2 (demo users + demo complaints) is DEVELOPMENT ONLY. Delete it, or
-- simply don't run it, before using this database for anything real.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Categories  (safe for production)
-- -----------------------------------------------------------------------------
insert into public.categories (name, description) values
  ('Electrical',      'Power supply, wiring, lighting, fans and electrical fittings.'),
  ('Plumbing',        'Water supply, taps, leaks, washrooms and drainage.'),
  ('Internet / Wi-Fi','Network connectivity, Wi-Fi access points and bandwidth issues.'),
  ('Classroom',       'Classroom furniture, projectors, boards and teaching aids.'),
  ('Hostel',          'Hostel rooms, wardrobes, beds and residential facilities.'),
  ('Transport',       'College buses, routes, timings and driver related issues.'),
  ('Canteen',         'Food quality, hygiene, pricing and canteen service.'),
  ('Cleaning',        'Housekeeping, garbage disposal and campus cleanliness.'),
  ('Security',        'Campus security, gate access, CCTV and safety concerns.'),
  ('Academic',        'Course content, timetable, exams, faculty and results.'),
  ('Other',           'Anything that does not fit the categories above.')
on conflict (name) do nothing;


-- =============================================================================
-- 2. DEVELOPMENT ONLY — demo accounts and demo complaints
-- =============================================================================
-- Creates 4 confirmed accounts that can log in immediately:
--
--   admin@resolvehub.dev  / ResolveHub@123   (role: admin)
--   staff@resolvehub.dev  / ResolveHub@123   (role: staff)
--   user1@resolvehub.dev  / ResolveHub@123   (role: user)
--   user2@resolvehub.dev  / ResolveHub@123   (role: user)
--
-- The demo password below is a LOCAL DEVELOPMENT credential only. It is never
-- referenced by application code and must never be used in production.
-- =============================================================================
do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  staff_id uuid := '22222222-2222-2222-2222-222222222222';
  user1_id uuid := '33333333-3333-3333-3333-333333333333';
  user2_id uuid := '44444444-4444-4444-4444-444444444444';
  accounts jsonb := jsonb_build_array(
    jsonb_build_object('id', admin_id, 'email', 'admin@resolvehub.dev', 'name', 'Aarav Menon'),
    jsonb_build_object('id', staff_id, 'email', 'staff@resolvehub.dev', 'name', 'Priya Nair'),
    jsonb_build_object('id', user1_id, 'email', 'user1@resolvehub.dev', 'name', 'Rahul Verma'),
    jsonb_build_object('id', user2_id, 'email', 'user2@resolvehub.dev', 'name', 'Sneha Iyer')
  );
  acct jsonb;
begin
  for acct in select * from jsonb_array_elements(accounts)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      (acct ->> 'id')::uuid,
      'authenticated',
      'authenticated',
      acct ->> 'email',
      crypt('ResolveHub@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', acct ->> 'name'),
      now(), now(), '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    values (
      acct ->> 'id',
      (acct ->> 'id')::uuid,
      jsonb_build_object('sub', acct ->> 'id', 'email', acct ->> 'email'),
      'email',
      now(), now(), now()
    )
    on conflict (provider, provider_id) do nothing;
  end loop;

  -- The profiles rows already exist (created by the on_auth_user_created
  -- trigger). Promote the two non-user accounts here, which is exactly the
  -- privileged operation a real deployment performs via the service-role key.
  update public.profiles set role = 'admin', full_name = 'Aarav Menon' where id = admin_id;
  update public.profiles set role = 'staff', full_name = 'Priya Nair'  where id = staff_id;
  update public.profiles set full_name = 'Rahul Verma' where id = user1_id;
  update public.profiles set full_name = 'Sneha Iyer'  where id = user2_id;

  -- ---------------------------------------------------------------------------
  -- Demo complaints (only if none exist yet, so re-running is safe)
  -- ---------------------------------------------------------------------------
  if (select count(*) from public.complaints) = 0 then

    insert into public.complaints
      (user_id, category_id, title, description, priority, status, location)
    select user1_id, c.id,
           'Projector in Lab 3 is not switching on',
           'The ceiling projector in Computer Lab 3 has not powered on since Monday. Practical sessions are being affected because slides cannot be projected.',
           'High', 'Submitted', 'Computer Lab 3, Block B'
    from public.categories c where c.name = 'Classroom';

    insert into public.complaints
      (user_id, category_id, title, description, priority, status, location, assigned_to, admin_remarks)
    select user2_id, c.id,
           'No Wi-Fi signal on the third floor of the library',
           'Wi-Fi drops completely on the third floor of the central library. Students cannot access online journals from the reading hall.',
           'Medium', 'Under Review', 'Central Library, 3rd Floor', staff_id,
           'Verified with the network team, awaiting a router replacement.'
    from public.categories c where c.name = 'Internet / Wi-Fi';

    insert into public.complaints
      (user_id, category_id, title, description, priority, status, location)
    select user1_id, c.id,
           'Water leakage near the main staircase',
           'Continuous water leakage from the pipe joint next to the main staircase. The floor stays wet and is a slipping hazard.',
           'Critical', 'Submitted', 'Academic Block, Ground Floor'
    from public.categories c where c.name = 'Plumbing';

    insert into public.complaints
      (user_id, category_id, title, description, priority, status, location, assigned_to, admin_remarks, resolution_notes)
    select user2_id, c.id,
           'Street light outside the hostel gate is dead',
           'The street light outside the hostel main gate has not worked for a week. The approach road is very dark after 7 PM.',
           'High', 'Resolved', 'Hostel Main Gate', staff_id,
           'Escalated to the electrical maintenance contractor.',
           'Replaced the faulty LED driver and verified the light is working.'
    from public.categories c where c.name = 'Electrical';

    -- Give the "Under Review" and "Resolved" complaints a believable timeline
    -- on top of the automatic rows created by the status triggers.
    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks, created_at)
    select c.id, 'Under Review', admin_id, 'Complaint acknowledged and under review.', c.created_at + interval '4 hours'
    from public.complaints c
    where c.complaint_number = 'CMP-000002';

    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks, created_at)
    select c.id, 'In Progress', staff_id, 'Maintenance team scheduled a site visit.', c.created_at + interval '1 day'
    from public.complaints c
    where c.complaint_number = 'CMP-000004';

    insert into public.complaint_status_history (complaint_id, status, changed_by, remarks, created_at)
    select c.id, 'Resolved', staff_id, 'Faulty LED driver replaced and tested.', c.created_at + interval '2 days'
    from public.complaints c
    where c.complaint_number = 'CMP-000004';

    -- Feedback only exists for the resolved complaint.
    insert into public.feedback (complaint_id, user_id, rating, comment)
    select c.id, user2_id, 5, 'Fixed quickly and the team kept me updated throughout.'
    from public.complaints c
    where c.complaint_number = 'CMP-000004';

    insert into public.notifications (user_id, complaint_id, title, message)
    select admin_id, c.id, 'New Complaint Submitted',
           'Complaint ' || c.complaint_number || ' requires review.'
    from public.complaints c where c.status = 'Submitted';
  end if;
end $$;
