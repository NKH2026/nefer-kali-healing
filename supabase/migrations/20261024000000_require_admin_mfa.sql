begin;
-- Membership check for enrollment; does not grant access to admin data.
create or replace function public.is_admin_identity()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
       or (au.user_id is null and lower(au.email) = lower(auth.jwt() ->> 'email'))
  );
$$;
revoke all on function public.is_admin_identity() from public, anon;
grant execute on function public.is_admin_identity() to authenticated;

-- All existing admin RLS policies, including storage, inherit mandatory MFA.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false)
     and public.is_admin_identity();
$$;
comment on function public.is_admin() is 'Requires admin membership and verified MFA (aal2).';
commit;
