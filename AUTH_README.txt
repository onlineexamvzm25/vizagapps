STOREOFGAMES — Phase 1 phone-number username + password

IMPORTANT DESIGN
- The user types their saved phone number and existing password.
- Phone is NOT verified and no OTP/SMS is used.
- The Phone provider does NOT need to be enabled.
- The application maps the phone to a private synthetic email identifier:
  9492511304@storeofgames.invalid
- Supabase Auth email/password is used internally.
- The synthetic identifier is never displayed to the user and no email is sent.
- The legacy password is migrated directly from storeusers to Supabase Auth.
- Password is never written into store_user_profiles.
- No registration page is included.

STEP 1 — SQL
Run PHASE1_PROFILE_ALIGNMENT.sql in Supabase SQL Editor.
It aligns the already-created store_user_profiles table, adds/ensures auth_user_id,
and sets own-profile RLS policies. It does not modify storeusers or inventory tables.

STEP 2 — AUTH PROVIDER
In Supabase Dashboard > Authentication > Sign In / Providers:
- Ensure Email provider is enabled.
- Phone provider can remain disabled.
- No SMS provider, SMTP provider, or OTP configuration is needed for the admin-created
  synthetic login account. The admin script marks the synthetic email confirmed.

STEP 3 — RUN ONE-TIME MIGRATION ON YOUR WINDOWS LAPTOP
Use a private local folder. Copy migrate-existing-user.mjs into it.
Install Node.js 20+ if needed. In Command Prompt:
  npm init -y
  npm install @supabase/supabase-js

Create .env in that private folder:
  SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_OR_SERVICE_ROLE_KEY

Get these from Supabase Project Settings > API. Use the service-role/secret key
ONLY in this local script. Never put it in auth.js, config.js, HTML, GitHub, or chat.

Run:
  node --env-file=.env migrate-existing-user.mjs

The script reads public.storeusers where uid=1, obtains the current password,
creates or updates the matching Supabase Auth account, and links the profile.
It never prints the password.

The script assumes the old password column contains the original plain-text
password used by the old application. If it contains a hash, STOP: a hash cannot
be used as a password and we need a reset process instead.

STEP 4 — DEPLOY FRONTEND
Replace the old project files with the contents of this folder. Keep auth.js,
config.js, storemanage.js, HTML and CSS files in the same hosting folder.
The Supabase anon key in auth.js is public client configuration; never add a
service-role key to browser files.

STEP 5 — TEST
Open index.html through your HTTPS GitHub Pages/site URL.
Login using:
  Phone: 9492511304
  Password: the existing storeusers password
The phone number is internally mapped to the synthetic identifier. The user does
not type or need to know that identifier.

Test refresh, direct internal-page access, change password and logout.

SECURITY SCOPE
This Phase 1 protects the application pages and the new profile table. It does
not yet revise RLS policies on the existing inventory/transaction tables.
We must inspect those policies and make a separate safe change before claiming
database-wide security.
