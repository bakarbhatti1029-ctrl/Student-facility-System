# Student Facility System (SFS) — Deployment Guide

**Developer:** Aqib Awan (Aqib Ejaz)
**Email:** aqibawan0102@gmail.com
**Phone:** +92-310-4693600
**College:** Govt. Shalimar Graduate College, Lahore

---

## Stack

| Layer      | Technology                          | Host     |
|------------|-------------------------------------|----------|
| Frontend   | React + Redux + Tailwind CSS        | Vercel   |
| Backend    | Node.js + Express + Socket.IO       | Render   |
| Database   | MongoDB Atlas                       | Atlas    |
| Payments   | Stripe (PKR)                        | Stripe   |
| Maps       | Leaflet + OpenStreetMap             | Free     |

> **Important:** Deploy backend to **Render** (not Vercel). Vercel serverless functions do not support Socket.IO or long-running processes. Frontend goes to Vercel.

---

## Step 0 — ⚠️ REMOVE THE DEMO SEEDER (do this BEFORE deploying)

The demo seeder fills the database with fake hostels, kitchens, and accounts
that **all share the password `password123`**. Fine for local demos —
dangerous on a live site, because anyone reading this public repo can log
into those accounts.

**Do these two things:**

**1. Delete these two lines from `backend/server.js` (lines 108–109 in this build):**

```js
const seedDummyData = require('./seedDummyData');
mongoose.connection.once('open', () => seedDummyData());
```

They appear right under the comment `// Seed dummy data on startup`.
After deleting them, restart locally once and confirm the server boots
with no `[Seeder]` lines in the console.

**2. Delete the seeder file itself:**

```bash
rm backend/seedDummyData.js
```

(If you want to keep it for local demos instead of deleting it, at minimum
delete the two lines above so it never auto-runs, and run it manually with
`node seedDummyData.js` only against your local database — never Atlas.)

**About the super admin:** there is no seed script for it — you create the
super admin yourself via Postman (`POST /api/admin/register`, see the
"Create the Super Admin" section below). Do it **immediately after the
backend goes live**, because the first registration on a fresh database
becomes super_admin without needing a token.

---

## Step 1 — MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Go to **Network Access** → Add IP → `0.0.0.0/0` (allow all)
5. Go to **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/sfs
   ```
6. Save this as your `MONGODB_URI`

---

## Step 2 — Stripe Setup

1. Go to https://dashboard.stripe.com and make sure **Test mode** is toggled on (top right) while you're still testing.
2. **Secret Key** (`STRIPE_SECRET_KEY`) — Developers → API Keys → "Secret key". Starts with `sk_test_...` in test mode. This goes in the **backend** env only. Never expose this one.
3. **Publishable Key** — same page, "Publishable key". Starts with `pk_test_...`. This goes in the **frontend** env as `REACT_APP_STRIPE_PUBLIC_KEY` — it's safe to expose in browser code, that's what it's designed for.
4. No Stripe webhook is needed. Both checkouts (hostel and food) confirm payment synchronously in the browser via `stripe.confirmCardPayment`, so there is no webhook route in the app and no `STRIPE_WEBHOOK_SECRET` to set.
5. PKR (Pakistani Rupees) must be enabled on your Stripe account (Settings → Payment methods / Business settings) or PaymentIntents in PKR will fail.

---

## Step 2b — Cloudinary Setup (Image Uploads)

Registration and profile forms now let people either **upload an image from their device** or **paste an image URL** — device uploads go through Cloudinary instead of being stored as base64 blobs in MongoDB.

1. Sign up free at https://cloudinary.com (free tier is plenty for this app's scale).
2. On your Cloudinary Dashboard, copy: **Cloud Name**, **API Key**, **API Secret**.
3. Set these three as backend env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
4. That's it — no extra Cloudinary-side configuration needed. If these are left unset, device upload shows a friendly error telling the person to use the "Image URL" tab instead, so the app still works without Cloudinary configured — it just loses the device-upload option.

---

## Step 2c — Email Setup (OTP / verification emails)

`backend/utils/emailService.js` sends OTP and notification emails through **Brevo's HTTPS API**, not through Gmail SMTP directly:

> **Local development** originally used `nodemailer` over Gmail SMTP (port 587), and that still works fine on your own machine or on any host that allows outbound SMTP.
>
> **Render's free tier blocks outbound SMTP** (a common anti-spam restriction on free-tier hosts), so this app uses Brevo over outbound HTTPS.

**Setting up Brevo:**
1. Create a Brevo account at https://www.brevo.com
2. Go to **Settings → Senders, domains, IPs → Senders**, add your sender email, and complete verification.
3. Go to **Settings → SMTP & API → API Keys**, generate a key, and copy it immediately.
4. Set these two backend env vars:
   ```env
   BREVO_API_KEY=xkeysib-your_key_here
   BREVO_FROM=your_verified_sender_email@gmail.com
   ```

**Known limitation:** a Gmail sender cannot have its domain authenticated by you, so messages may land in spam. For production, use your own domain and authenticate it in Brevo; a verified Gmail sender is sufficient for a demo/FYP.

---

## Step 3 — Backend Deployment on Render

1. Go to https://render.com → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

4. Add these Environment Variables in Render dashboard:

```env
NODE_ENV=production
PORT=10000

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sfs

JWT_SECRET=your_long_random_secret_here

EMAIL=aqibawan0102@gmail.com
CONTACT_NOTIFY_EMAIL=aqibawan0102@gmail.com

BREVO_API_KEY=xkeysib-your_key_here
BREVO_FROM=your_verified_sender_email@gmail.com

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

ALLOWED_ORIGIN=https://your-frontend.vercel.app

REQUIRE_EMAIL_SUCCESS=true
```

> `FRONTEND_URL` and the `JAZZCASH_*` vars from older versions of this guide have been removed below — see "Env vars that don't actually do anything yet" further down for why. (There is no Stripe webhook in this app, so there's no `STRIPE_WEBHOOK_SECRET` to set either.)

5. Deploy → note your backend URL e.g. `https://sfs-backend.onrender.com`

⚠️ **Do not create a `vercel.json` in the `backend` folder and deploy it to Vercel.** Vercel's serverless functions can't hold the persistent connections Socket.IO needs (real-time order tracking and chat rely on it) — the backend must go on Render (or another server that stays running), never Vercel.

---

## Step 4 — Frontend Deployment on Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App
   - **Build Command:** `CI=false npm run build`
   - **Output Directory:** `build`

> **⚠️ `CI=false` is required.** Vercel sets `CI=true` during builds, which makes
> Create React App treat ESLint *warnings* as *errors* — the project has some
> harmless unused-variable warnings, so without `CI=false` the deployment will
> fail with "Treating warnings as errors". Either put `CI=false` in the Build
> Command as shown above, or add an environment variable `CI` = `false` in
> Project → Settings → Environment Variables. (Verified: the production build
> succeeds cleanly with this flag.)

4. Add these Environment Variables (Project → Settings → Environment Variables — set them directly in the dashboard, don't rely on a `vercel.json` `env` block, that syntax is deprecated and will silently fail):

```env
REACT_APP_API_URL=https://sfs-backend.onrender.com
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key
```

**What these two actually are:**
- **`REACT_APP_API_URL`** — the base URL your React app sends every API request to. In dev it's `http://localhost:5000` (your local backend); in production it must be your live Render backend URL from Step 3, with no trailing slash. You choose this value yourself — it's not something you "find," it's whatever your Render service's public URL turns out to be after you deploy it (Render shows it at the top of your service's dashboard page, e.g. `https://sfs-backend-xxxx.onrender.com`).
- **`REACT_APP_STRIPE_PUBLIC_KEY`** — your Stripe **publishable** key from Step 2 above (`pk_test_...`). This is what lets the `CardElement` on your checkout pages render and accept card input in the browser. Get it from dashboard.stripe.com → Developers → API keys.

Any environment variable prefixed `REACT_APP_` is baked into the build at build time (that's a Create React App rule, not a Vercel one) — so if you change either value later, you need to redeploy, not just restart.

5. Deploy → note your frontend URL e.g. `https://sfs.vercel.app`

6. Go back to **Render** → update `ALLOWED_ORIGIN` to your Vercel URL (comma-separate if you need more than one, e.g. a preview URL and a production domain)

---

## Step 5 — Seed Dummy Data (Optional, testing only)

To seed 15 students, 15 hostels, 15 kitchens for testing:

```bash
# Locally
cd backend
node seedDummyData.js

# Or it runs automatically on server start (checks if data exists first,
# so it's safe even if this is still active when you deploy)
```

### Removing dummy data before real deployment

You said you'll strip this out before going live — here's exactly how:

**1. Delete the seeder file:**
```bash
cd backend
rm seedDummyData.js
```

**2. Remove the two lines that call it in `backend/server.js`:**

Open `backend/server.js` and delete these two lines (currently around line 108–109):
```js
// Seed dummy data on startup (safe — checks existing data first)
const seedDummyData = require('./seedDummyData');
mongoose.connection.once('open', () => seedDummyData());
```

Right above them is `connectDB();` — leave that line, it's the real DB connection, not part of the seeder.

**3. If you already deployed with the seeded data still in your database:**

The 15 dummy hostels/kitchens/students will still be sitting in MongoDB Atlas even after you remove the code — deleting the seeder only stops it from running *again*, it doesn't retroactively clean up. To actually remove them, either:
- In MongoDB Atlas → Browse Collections → manually delete documents where they're obviously dummy data (seeded names/emails are consistent and easy to spot), or
- Simplest: if nothing real has been created yet, just drop the whole database and let it start empty (Atlas → your cluster → ... → drop database), then redeploy.

**4. Verify it's gone:** boot the backend locally with your real `.env` and confirm the console does *not* print any `[Seeder]` log lines on startup (grep the file first if unsure: `grep -rn "Seeder" backend/` should return nothing once removed).

---

## Step 6 — Create Super Admin

The super admin account isn't seeded automatically — you create it once, manually, via a direct API call. This works **either before or after the frontend is deployed** (it only needs the backend running), but you obviously need the backend's real URL either way.

**If doing this before frontend deployment (backend only, testing locally or already on Render):**

```bash
POST https://sfs-backend.onrender.com/api/admin/register
Content-Type: application/json

{
  "first_name": "Aqib",
  "last_name": "Awan",
  "email": "aqibawan0102@gmail.com",
  "password": "your_admin_password",
  "confirmPassword": "your_admin_password"
}
```

Run this once via Postman, curl, or Thunder Client:
```bash
curl -X POST https://sfs-backend.onrender.com/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Aqib","last_name":"Awan","email":"aqibawan0102@gmail.com","password":"your_admin_password","confirmPassword":"your_admin_password"}'
```

**Step by step:**
1. Deploy the backend to Render first (Step 3) — you need its live URL for this to work; localhost works too if you're just testing before deploying anything.
2. Send the request above **exactly once**. `registerAdmin` checks `Admin.countDocuments()` first — if zero admins exist, this call becomes `super_admin` automatically, no token needed. If you run it again after that, it'll require a valid `super_admin` JWT in the `Authorization` header (i.e. it'll reject you with a 401 unless you're already logged in as the super admin), so it can't accidentally create a second unauthenticated super admin.
3. Go to `https://your-frontend.vercel.app/admin/login` (or `http://localhost:3000/admin/login` locally) and log in with the email/password you just used.
4. You'll land on the admin dashboard with full access, including "Manage Admins" (only super_admin sees this tab) — from there you can create up to 4 mini admins if you need other people to help moderate.
5. **Changing your password later:** you never need Postman again. Log in to the dashboard and use **Change Password** (`PATCH /api/admin/change-password`) — it works for the super admin's own password too. The standalone `resetSuperAdminPassword.js` script is only for the "forgot my password completely" case.

**If you do this after the frontend is deployed:** no difference in steps — just make sure you're hitting your real Render backend URL, not localhost, in the `POST` request above.

> **⚠️ Do this immediately after the backend goes live.** On a fresh database, whoever hits `POST /api/admin/register` first becomes super_admin. Register yourself via Postman before sharing the backend URL with anyone.

**Forgot the super admin password later?** The dashboard intentionally refuses to reset it. Use the recovery script on the server instead (no credentials are stored in the file — you pass them as arguments):
```bash
cd backend
node resetSuperAdminPassword.js your@email.com "YourNewStrongPassword"
```

---

## Environment Variables Reference

### Backend (complete list)

| Variable              | Description                                   | Required |
|-----------------------|-----------------------------------------------|----------|
| `NODE_ENV`            | `production`                                  | ✅ |
| `PORT`                | `10000` (Render) or `5000` (local)           | ✅ |
| `MONGODB_URI`         | MongoDB Atlas connection string               | ✅ |
| `JWT_SECRET`          | Long random string for JWT signing            | ✅ |
| `EMAIL`               | Address used for the Contact Us notification destination | ✅ |
| `BREVO_API_KEY`       | Brevo API key used to send transactional emails over HTTPS | ✅ |
| `BREVO_FROM`          | Your verified Brevo sender email | ✅ |
| `APP_PASSWORD`        | Gmail App Password — only needed if you replace Brevo with nodemailer/SMTP | Optional (local/SMTP only) |
| `CONTACT_NOTIFY_EMAIL` | Where Contact Us submissions get emailed. Defaults to `EMAIL` if unset | Optional |
| `STRIPE_SECRET_KEY`   | Stripe secret key `sk_test_...`               | ✅ |
| `ALLOWED_ORIGIN`      | Comma-separated frontend URL(s) for CORS + Socket.IO | ✅ |
| `REQUIRE_EMAIL_SUCCESS` | `true` = block signup if the verification email fails to send | Optional |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard → Cloud Name | ✅ for device image uploads (URL-paste option still works without it) |
| `CLOUDINARY_API_KEY`    | Cloudinary dashboard → API Key    | ✅ for device image uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard → API Secret | ✅ for device image uploads |
| `DEBUG_LOGS`          | `true` to keep verbose debug logs in production (default: off in production) | Optional |

### Frontend (complete list)

| Variable                     | Description                        | Required |
|------------------------------|-------------------------------------|----------|
| `REACT_APP_API_URL`          | Your live Render backend URL, no trailing slash | ✅ |
| `REACT_APP_STRIPE_PUBLIC_KEY`| Stripe publishable key `pk_test_…` from dashboard.stripe.com | ✅ |

### Env vars that don't actually do anything yet

These show up in older versions of this guide / `.env.example` files but nothing in the current code reads them. They're not harmful to leave in your `.env` (unused env vars are just ignored), but don't waste time hunting for real values for these:

| Variable | Why it's dead |
|----------|----------------|
| `FRONTEND_URL` | Leftover from an old Stripe **hosted Checkout redirect** flow that no longer exists — checkout now uses an in-page `CardElement`, no redirect, so nothing needs to know the frontend's URL for payment purposes. |
| `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`, `JAZZCASH_PAYMENT_URL` | JazzCash (and EasyPaisa) are shown in the UI as **"Locked"** options in the payment method selector — they're not wired up to any backend integration yet. To enable one later, flip its `status: 'pending'` to `status: 'active'` in `frontend/src/components/PaymentOptions.js`, then do the actual gateway integration. These vars are placeholders for whenever that gets built. |

---

## API Endpoints Reference

*(Verified against the actual route files - not aspirational.)*

### Auth — mounted at `/auth`
```
POST   /auth/register           Registration (student/hostel owner/kitchen owner)
POST   /auth/login               Login
PATCH  /auth/verifyEmail         Verify OTP after registration (JWT required)
GET    /auth/resendOTP           Resend registration OTP (JWT required)
POST   /auth/forgot-password     Request password-reset OTP
POST   /auth/verify-otp          Verify password-reset OTP (JWT required)
PATCH  /auth/reset-password      Set new password (JWT required)
```

### Admin — mounted at `/api/admin`
```
POST   /api/admin/register                  Create super admin (first call only)
POST   /api/admin/login                      Admin login
PATCH  /api/admin/change-password            Change own password
GET    /api/admin/list                       List mini admins (super_admin only)
DELETE /api/admin/:id/delete                 Delete mini admin (super_admin only)
PATCH  /api/admin/:id/reset-password         Reset mini admin password (super_admin only)

GET    /api/admin/stats                      Dashboard stats
GET    /api/admin/students
DELETE /api/admin/students/:id
PATCH  /api/admin/students/:id/ban
PATCH  /api/admin/students/:id/unban
GET    /api/admin/hostel-owners
PATCH  /api/admin/hostel-owners/:id/approve
DELETE /api/admin/hostel-owners/:id/reject
PATCH  /api/admin/hostel-owners/:id/ban
PATCH  /api/admin/hostel-owners/:id/unban
DELETE /api/admin/hostel-owners/:id
GET    /api/admin/kitchen-owners
PATCH  /api/admin/kitchen-owners/:id/approve
DELETE /api/admin/kitchen-owners/:id/reject
PATCH  /api/admin/kitchen-owners/:id/ban
PATCH  /api/admin/kitchen-owners/:id/unban
DELETE /api/admin/kitchen-owners/:id
GET    /api/admin/hostels
DELETE /api/admin/hostels/:id
GET    /api/admin/kitchens
DELETE /api/admin/kitchens/:id
```

### Contact Us — mounted at `/api/contact`
```
POST   /api/contact/submit           Submit a contact message (public)
GET    /api/contact/all              List all messages (admin only)
PATCH  /api/contact/:id/status       Update message status (admin only)
DELETE /api/contact/:id              Delete a message (admin only)
```

### Image Upload — mounted at `/api/upload`
```
POST   /api/upload/image             Upload an image file (multipart, field name "image") to
                                      Cloudinary, returns { url, public_id }. Used by the
                                      "Upload from device" tab on registration/profile forms.
                                      Rate-limited to 30 uploads / 15 min per IP.
```

### Hostels — mounted at `/hostel`
```
GET  /hostel/getAllHostels           All approved hostels (with rooms + beds)
GET  /hostel/getFilteredHostels      Filter by university name, distance, facility
```

### Rooms — mounted at `/api/rooms` (hostel owner only, auth required)
```
POST   /api/rooms/createRoom
GET    /api/rooms/getAllRooms
GET    /api/rooms/getRoom/:id
PUT    /api/rooms/updateRoom/:id
DELETE /api/rooms/deleteRoom/:id
```

### Bookings — mounted at `/api/bookings` (auth required)
```
GET    /api/bookings/booked-rooms              Student's own booked-room history
GET    /api/bookings/HostelOwnerBookedBeds      Hostel owner's booked-beds view
POST   /api/bookings/book/:hostelId/:roomId/:bedId    Book a bed
DELETE /api/bookings/unbookBed/:bookingId       Cancel/remove a booking (student who booked it, or the owning hostel owner)
```

### Kitchens & Dishes
```
GET    /kitchen/getAllKitchens              All approved kitchens
POST   /api/dishes/createDish               (kitchen owner, auth required)
GET    /api/dishes/getAllDishes             (kitchen owner, auth required)
GET    /api/dishes/getDish/:id
PUT    /api/dishes/updateDish/:id
DELETE /api/dishes/deleteDish/:id
```

### Cart — mounted at `/api/cart` (auth required)
```
POST   /api/cart/addItem
GET    /api/cart/getItem
PUT    /api/cart/updateItem/:kitchenId/:productId
DELETE /api/cart/:kitchenId/:productId
DELETE /api/cart/:kitchenId
```

### Orders — mounted at `/api/order` (auth required)
```
POST   /api/order/create                Create order + Stripe PaymentIntent
POST   /api/order/confirm-payment       Confirm payment after 3D Secure step
GET    /api/order/kitchen               Kitchen owner's orders
GET    /api/order/customer              Student's own orders
PATCH  /api/order/update/:orderId       Update order status (also accepts PUT)
DELETE /api/order/delete/:orderId       Remove an order
```

### Chat & Chatbot
```
POST   /api/chatbot/message      Chatbot message (public)
GET    /api/chats/:orderId       Order-specific chat history
POST   /api/chats                Send a chat message
```

---

## Payment Flow

Both hostel booking and food checkout use the **same pattern**: an in-page Stripe `CardElement`, no redirect to a separate Stripe-hosted page. (An earlier version of the food checkout *did* redirect to Stripe's hosted Checkout, but that depended on a webhook to ever confirm payment — impossible to receive on localhost — and was marking orders as "paid" regardless of whether payment actually succeeded. It's been fully replaced.)

```
Student fills in the checkout form (name/email/phone/etc.) and enters their
card directly into the CardElement on the same page
→ frontend calls stripe.confirmCardPayment() with the PaymentIntent's client secret
→ backend PaymentIntent was created server-side when checkout started
→ on success, frontend calls the backend to mark the booking/order as paid
→ if the card requires 3D Secure, Stripe's confirmCardPayment handles that
  challenge in-browser before resolving
```

### Stripe Test Card
```
Card Number : 4242 4242 4242 4242
Expiry      : Any future date (e.g. 12/34)
CVC         : Any 3 digits (e.g. 123)
```

---

## Common Deployment Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS error | `ALLOWED_ORIGIN` missing your Vercel URL | Add your exact Vercel URL to `ALLOWED_ORIGIN` in Render (comma-separate for multiple) |
| Socket.IO not connecting | Wrong `ALLOWED_ORIGIN` | Same fix — both CORS and Socket.IO read `ALLOWED_ORIGIN` |
| Frontend build fails on Vercel with env-var-related error | Old `vercel.json` used deprecated `@secret_name` syntax | Removed — set env vars directly in Vercel dashboard instead |
| Backend accidentally deployable to Vercel | A stray `backend/vercel.json` existed pointing at `server.js` | Removed — backend must run on Render (or similar), Socket.IO needs a persistent process |
| Stripe payment fails | Wrong key name, or PKR not enabled on account | Use only `STRIPE_SECRET_KEY`; enable PKR in Stripe account settings |
| Can't type in the card field | `REACT_APP_STRIPE_PUBLIC_KEY` missing or wrong | Double check it's set in Vercel and matches the same Stripe account as the backend's secret key |
| `super_admin` enum error | Old Admin model | Model now supports `['admin', 'super_admin']` ✅ |
| Beds not showing | Rooms not deep-populated | Fixed — `getAllHostels` now populates beds ✅ |
| Map not showing hostel | Missing `hostel_lat/lng` | Auto-geocoded from address on registration ✅ |
| `Cannot read removeLayer` | Leaflet map unmount crash | Fixed with try/catch in cleanup ✅ |
| Mongo connection fails | IP not whitelisted | Add `0.0.0.0/0` in Atlas Network Access |
| Backend cold start slow | Render free tier sleeps | First request takes ~30s on free tier — expected |
| `npm run seed` connects to wrong database | `seed.js` was hardcoded to `mongodb://localhost:27017` | Fixed — now reads `MONGODB_URI` from your `.env` like the rest of the app ✅ |

---

## Admin Panel Access

| Role        | Login URL      | Access |
|-------------|----------------|--------|
| super_admin | `/admin/login` | All tabs including Manage Admins |
| mini admin  | `/admin/login` | All tabs except Manage Admins |

**Default password for seeded dummy accounts:** `password123`

---

## Features Checklist

### Student
- [x] Register, email verify, login
- [x] Browse hostels with Leaflet map
- [x] Filter by university, distance, type, facility
- [x] View rooms and available beds
- [x] Book bed via Stripe (PKR, in-page CardElement)
- [x] Browse kitchens and dishes
- [x] Add to cart, checkout via Stripe (PKR, in-page CardElement)
- [x] View bookings and orders, with real-time order-status tracking (Socket.IO)
- [x] Cancel/remove a booking from history (actually frees the bed now)
- [x] Contact Us form (real backend, saved to MongoDB + emailed)
- [x] Chatbot assistant

### Hostel Owner
- [x] Register with hostel details + nearby institutes + distance
- [x] Admin approval required
- [x] Add/edit/delete rooms and beds
- [x] View student bookings (real data - bed-to-booking matching fixed)
- [x] Cancel/remove a booking from the owner's side too
- [x] Dashboard with stats

### Kitchen Owner
- [x] Register with kitchen details
- [x] Admin approval required
- [x] Add/edit/delete dishes (PKR)
- [x] Receive orders via Socket.IO in real-time
- [x] Update order status
- [x] Ordering chart now shows real completed-order data (was hardcoded placeholder data before)

### Super Admin
- [x] Login at `/admin/login`
- [x] Approve/ban hostel and kitchen owners
- [x] Ban/unban students
- [x] View dashboard stats
- [x] Create up to 4 mini admins
- [x] Reset mini admin passwords
- [x] Change own password
- [x] View + reply to Contact Us messages (WhatsApp/Gmail deep links)

---

## Chatbot Trained Queries

The chatbot now understands these types of questions:

| Query Type | Example |
|------------|---------|
| Greeting | "Hi", "Salam", "Hello" |
| Hostel info | "Show hostels", "Available rooms" |
| Cheap hostel | "Cheap hostel", "Sasta hostel", "Budget room" |
| Cheap food | "Cheap food", "Sasti khana", "Affordable dishes" |
| Nearby hostel | "Hostel near UET", "Hostel near Punjab University" |
| University filter | "Hostel near LUMS", "Rooms near Shalimar College" |
| Availability | "Available beds", "Khali room" |
| Food | "Food menu", "Kitchen dishes", "Order khana" |
| Pricing | "How much", "Kitna price", "PKR cost" |
| Payment | "How to pay", "Stripe", "Card payment" |
| Booking | "My booking", "Meri booking" |
| Cancel | "Cancel booking", "Wapas karna" |
| Facilities | "Wi-Fi hostel", "AC room", "Generator" |
| Contact | "Help", "Support", "Aqib contact" |

---

Built with ❤️ by Aqib Awan — Final Year Project, Govt. Shalimar Graduate College, Lahore


## Recent deployment notes

- Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` together in the deployed backend environment to enable the browser notification bell.
- `/api/upload/image` is authenticated. `/api/upload/registration-image` is the pre-login route for registration images and only accepts `profile`, `hostel`, and `kitchen` types.
- Both image routes only accept JPG, PNG, WEBP, or GIF files up to 5 MB. The registration route is limited to 8 requests per 15 minutes per IP.

- After changing backend environment variables, redeploy the backend. After changing `REACT_APP_*` variables, rebuild/redeploy the frontend.
