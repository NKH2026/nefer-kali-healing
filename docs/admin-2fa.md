# Admin two-factor authentication

Admin login requires a password and an authenticator code. The first login
prompts an authorized admin to scan a QR code and verify a six-digit code.
Returning admins enter a code after their password. Refreshing the login page
resumes verification. Unfinished authenticator enrollments are replaced when
setup resumes; verified authenticators are never removed by this flow.

## Release

1. Apply `supabase/migrations/20261024000000_require_admin_mfa.sql` in the
   existing project's Supabase SQL Editor. This immediately blocks admin data
   access for password-only sessions. Coordinate the website release with this
   step so existing admins can enroll promptly.
2. Deploy the updated website.
3. Redeploy `supabase/functions/admin-agent` using the normal deployment process.
   The function now checks the caller's MFA-protected `is_admin()` result before
   using its privileged database connection.
4. Visit `/admin/login`, sign in, scan the QR code in your authenticator app,
   and enter its code. Keep a secure backup of your authenticator.

Existing admin policies using `public.is_admin()` now require `aal2`. The
new `is_admin_identity()` RPC checks only the current user's membership for
enrollment and returns a boolean; it does not grant access to admin data.
Linked admin records match the user ID. Email fallback applies only to unlinked
legacy records.

## Verify after release

- An admin without a factor sees setup after entering the correct password.
- A bad or expired code keeps the admin on the verification screen.
- A valid code allows dashboard access and admin data operations.
- Sign out and back in: a code is required again.
- Refresh before entering a code: verification resumes.
- A password-only session cannot access admin data, storage mutations, or the
  admin-agent endpoint. The endpoint returns HTTP 403.
- A non-admin account cannot enter the dashboard or start admin enrollment.
- Public pages and public data reads still work.

## Lost authenticator

A trusted Supabase project owner must verify the admin's identity and remove
the lost MFA factor using Supabase's administrative MFA controls. Never put
service-role credentials or a factor-reset endpoint in the browser. Revoke
the affected account's sessions, then have the admin sign in and enroll a new
authenticator. This implementation does not issue recovery codes.

Reference: https://supabase.com/docs/guides/auth/auth-mfa/totp
