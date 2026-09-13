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

## Structure

- `routes/` + `controllers/` — one pair per domain (auth, hostel, kitchen owner, admin, contact, etc.)
- `models/` — Mongoose schemas, grouped by role (`student/`, `hostelowner/`, `kitchenowner/`)
- `sockets/socket.js` — Socket.IO setup; rooms are `room-user{studentId}` and `room-kitchen{kitchenId}`
- `middlewares/AuthToken.js` — JWT verification, attaches `req.user = { id, email, role }`
- `seedDummyData.js` — auto-seeds realistic dummy data on empty DB (see `server.js`)
- `seed.js` — separate standalone seeder script, run manually with `node seed.js`

## Deployment

Deploy to **Render** (or any host that keeps a persistent process running) — not Vercel. Socket.IO needs a long-lived connection that serverless functions can't provide. Full steps in `../DEPLOYMENT_GUIDE.md`.
