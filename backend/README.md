# Student Facility System — Backend

Node.js + Express + Socket.IO + MongoDB backend for SFS — connects students with hostel accommodation and homemade food kitchens in Lahore.

For the frontend, see `../frontend`. For full deployment steps (Vercel + Render + MongoDB Atlas + Stripe), see `../DEPLOYMENT_GUIDE.md`.

## Local setup

```bash
npm install
cp .env.example .env   # then fill in real values - see table below
node server.js         # or: npm run dev (nodemon)
```

Runs at http://localhost:5000 by default. Requires a running MongoDB instance (local or Atlas) at `MONGODB_URI`.

On first connection, `seedDummyData.js` automatically seeds 15 hostels, 15 kitchens, and 15 students (real Lahore GPS coordinates) if the database is empty — safe to run repeatedly, it checks for existing data first.

## Environment variables

| Variable | Required | What it's for |
|----------|----------|----------------|
| `PORT` | ✅ | Port to listen on |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Signs auth tokens - use a long random string |
| `EMAIL` | ✅ | Address used as the Contact Us notification destination |
| `BREVO_API_KEY` / `BREVO_FROM` | ✅ | Sends OTP, password-reset, receipt, and notification emails through Brevo's HTTPS API. `BREVO_FROM` must be a verified Brevo sender |
| `APP_PASSWORD` | Optional | Gmail [App Password](https://myaccount.google.com/apppasswords) — only needed if you replace the Brevo API service with nodemailer/SMTP |
| `CONTACT_NOTIFY_EMAIL` | Optional | Where Contact Us submissions get emailed; defaults to `EMAIL` |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_test_...`) - server-side only, never expose this |
| `ALLOWED_ORIGIN` | ✅ | Comma-separated frontend URL(s) for CORS and Socket.IO |
| `REQUIRE_EMAIL_SUCCESS` | Optional | `true` blocks signup if the verification email fails to send |

`STRIPE_WEBHOOK_SECRET` and the `JAZZCASH_*` vars are **not read anywhere in the current code** — checkout confirms payment synchronously in-browser (no webhook), and JazzCash is a "Coming Soon" UI placeholder only. Leave them unset.

## First-time super admin setup (Postman)

The first admin registered through `POST /api/admin/register` becomes a `super_admin` with `email_verified: false`. Log in normally through `POST /api/admin/login`; the response sets an HTTP-only `sfs_session` cookie. Then call `PATCH /api/admin/change-password` with the session cookie and CSRF header:

```json
{
  "currentPassword": "initial-password",
  "newPassword": "your-new-password",
  "confirmPassword": "your-new-password"
}
```

For an unverified super admin, a successful password change sends a verification code to the account email and returns `requiresVerification: true`. Confirm it through `POST /api/admin/verify-superadmin`:

```json
{"email":"superadmin@example.com","otp":"123456"}
```

The code expires after five minutes. If it expires or email delivery fails, use `POST /api/admin/resend-superadmin-verification` with `{"email":"superadmin@example.com"}` to request a fresh code. Email verification is set to true only after a valid code is confirmed.

## Admin forgot-password flow

From the admin login page, request a reset code using the admin account email. The public admin endpoints are:

1. `POST /api/admin/forgot-password` with `{"email":"admin@example.com"}` sends a five-minute code when the account exists. The response is intentionally the same whether or not the email belongs to an admin.
2. `POST /api/admin/verify-password-reset-otp` with `{"email":"admin@example.com","otp":"123456"}` verifies and consumes the code, then returns a short-lived reset token.
3. `PATCH /api/admin/reset-password` with `{"password":"new-password","confirmPassword":"new-password"}` and the reset session cookie updates the password. The reset session is single-use and expires after ten minutes.

These recovery routes are public and rate limited. They are separate from super-admin onboarding verification and require the configured Brevo email settings to deliver codes.

## Structure

- `routes/` + `controllers/` — one pair per domain (auth, hostel, kitchen owner, admin, contact, etc.)
- `models/` — Mongoose schemas, grouped by role (`student/`, `hostelowner/`, `kitchenowner/`)
- `sockets/socket.js` — Socket.IO setup; rooms are `room-user{studentId}` and `room-kitchen{kitchenId}`
- `middlewares/AuthToken.js` — JWT verification, attaches `req.user = { id, email, role }`
- `seedDummyData.js` — auto-seeds realistic dummy data on empty DB (see `server.js`)
- `seed.js` — separate standalone seeder script, run manually with `node seed.js`

## Deployment

Deploy to **Render** (or any host that keeps a persistent process running) — not Vercel. Socket.IO needs a long-lived connection that serverless functions can't provide. Full steps in `../DEPLOYMENT_GUIDE.md`.


## Recent security and reliability updates

- Authentication accepts a bearer token or the `sfs_session` HTTP-only cookie; normal sessions verify that the account still exists and is not banned.
- Login/profile responses do not expose password hashes or reset/verification values.
- Password-reset OTPs are account-scoped, consumed on verification, and issue a 10-minute reset token.
- `/api/upload/image` requires authentication. `/api/upload/registration-image` permits only `profile`, `hostel`, and `kitchen` images before login, limited to 8 uploads per 15 minutes per IP.
- Bed reservation is atomic before Stripe runs. Cancellations attempt a refund before local payment state changes.

- Cookie-authenticated writes require a matching `sfs_csrf` / `X-CSRF-Token` double-submit token. This is intentional CSRF protection; do not bypass it for authenticated endpoints.
- Once Stripe accepts a hostel payment, bed state and booking history are saved in one MongoDB transaction to prevent partial database writes.

- Run `npm test -- --runInBand` from `backend` to execute the session-cookie and CSRF tests.
