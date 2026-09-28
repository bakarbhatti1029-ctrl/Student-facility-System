# Student Facility System — Frontend

React + Redux Toolkit + Tailwind CSS frontend for SFS, a platform connecting students in Lahore with hostel accommodation and homemade food kitchens.

Built with Create React App. For the backend, see `../backend`. For full deployment steps (Vercel + Render + MongoDB Atlas + Stripe), see `../DEPLOYMENT_GUIDE.md`.

## Local setup

```bash
npm install
cp .env.example .env   # then fill in the two values below
npm start
```

Runs at http://localhost:3000. Requires the backend running locally too (see `../backend/README.md`).

## Environment variables

| Variable | What it is |
|----------|------------|
| `REACT_APP_API_URL` | Base URL of the backend API. `http://localhost:5000` locally, your Render URL in production. |
| `REACT_APP_STRIPE_PUBLIC_KEY` | Stripe publishable key (`pk_test_...`) from dashboard.stripe.com → Developers → API keys. Powers the `CardElement` on both checkout pages. |

Both are read at **build time** (a Create React App rule) — changing them means rebuilding, not just restarting.

## Structure

- `src/components/hostelBooking/` — hostel search, room/bed booking, checkout
- `src/components/homemadeFood/` — kitchen browsing, cart, food checkout, order tracking
- `src/components/admin/` — super admin / mini admin dashboard
- `src/components/chatBot/` — floating chatbot widget
- `src/store/` — Redux Toolkit slices (auth, bookings, orders, cart)

## Available scripts

- `npm start` — dev server with hot reload
- `npm run build` — production build to `build/`
- `npm test` — CRA test runner

## Tech notes

- Real-time order status updates arrive via Socket.IO — make sure `REACT_APP_API_URL` matches whatever origin the backend's `ALLOWED_ORIGIN` allows, or the socket connection will silently fail.
- Payments use Stripe's in-page `CardElement` (both hostel booking and food checkout) — there's no redirect to a separate Stripe-hosted page.


## Recent client updates

- Axios sends cross-origin API cookies. The backend supports an HTTP-only `sfs_session` cookie while existing bearer-token calls remain compatible during migration.
- Role-aware `ProtectedRoute` guards prevent protected screens from mounting before redirect. The API remains the authorization source of truth.
- The redesigned chatbot provides quick prompts, timestamps, concise guidance, a new-conversation action, and responsive layout.

- Registration device uploads use the restricted registration endpoint; post-login profile/listing uploads use the authenticated endpoint.
