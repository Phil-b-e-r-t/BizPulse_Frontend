# BizPulse Frontend

React (JavaScript) + Vite + React Router + Tailwind CSS + Recharts + TanStack Query + React Hook Form.
Milestone 1: authentication, application shell, dashboard. Built against `BizPulse_Frontend_Handoff.pdf`.

## Run on Windows (PowerShell)

Requires Node.js 20 or newer (`node -v`).

```powershell
cd BizPulse_Frontend
npm install
copy .env.example .env
npm run dev
```
Open http://localhost:5173.

Other commands: `npm run build` (production build), `npm run lint`.

## Connect to the backend

Backend repository: https://github.com/maur-ice/bizpulse-backend (API reference: `docs/FRONTEND_HANDOFF.md` and `docs/API_CHANGELOG.md` there; the changelog takes priority).

1. Start the backend (see its README). Check `http://localhost:5000/health`.
2. In `.env` set `VITE_API_URL=http://localhost:5000/api/v1`.
3. Make sure the backend's `CORS_ORIGINS` includes `http://localhost:5173` (default) and every deployed frontend URL.
4. Restart `npm run dev` after any `.env` change.

### No backend yet? Use sample data
Set `VITE_USE_MOCKS=true` in `.env` and restart. A yellow "Sample data" banner shows while this is on.
- Populated demo business: `demo@bizpulse.test` / `demo12345`
- Registering any new account gives an empty business (to see empty states and the onboarding checklist)
- Wrong password gives `INVALID_CREDENTIALS`; signing out ends the sample session

### Sessions and refresh tokens
The backend issues a 15-minute access token and keeps a 30-day refresh token in an **httpOnly cookie** (`bp_refresh`).
- The access token is kept **in memory only** (never in `localStorage` or `sessionStorage`).
- Every request uses `credentials: 'include'` so the browser stores and sends the cookie.
- On page load the app calls `POST /auth/refresh`; success means the user is still signed in.
- When a request gets `401 INVALID_TOKEN`, the client refreshes once (one refresh at a time, across tabs too) and repeats the request.
- Sign out calls `POST /auth/logout` so the token stops working on the server.
- `/auth/refresh` and `/auth/logout` send the header `X-BizPulse-Client: web` (CSRF protection).
- In development `localhost:5173` and `localhost:5000` count as the same site, so the default `lax` cookie works. In production host the app and API on the same site (for example `app.example.com` and `api.example.com`), or the backend must use `REFRESH_COOKIE_SAMESITE=none` over HTTPS.

### Creating sales safely (for the Sell screen)
`POST /transactions` accepts an `Idempotency-Key` header so a retry can never record two sales. The client supports it:
```js
import { api, newIdempotencyKey } from '../api/client';
const key = newIdempotencyKey();            // one key per attempt to sell; keep it in state
api.post('/transactions', sale, { idempotencyKey: key });   // reuse the SAME key to retry
```
Create a new key when the user starts a new sale or changes the cart.

## Where to put images
`public/brand/logo.png`, `public/brand/favicon.png`, optional `public/brand/auth-hero.jpg` (see `public/brand/README.txt`).

## Structure
```
src/
  api/          fetch client, session (in-memory token), error mapping, one file per backend area
  components/   Logo, FormAlert, ui/ (Button, Field, Toast, Skeleton, EmptyState, ErrorState, Badge, Spinner)
  config/       env.js, navigation.js (role-aware menu)
  context/      AuthContext (token, user, business, login/register/logout, session restore)
  features/     dashboard/ (metric cards, chart, channels, products, low stock, activity, onboarding)
  hooks/        TanStack Query hooks
  layouts/      AuthLayout, AppLayout, Sidebar, BottomNav, UserMenu
  mocks/        MSW sample data (only loaded when VITE_USE_MOCKS=true)
  pages/        Login, Register, Dashboard, More, ComingSoon
  routes/       ProtectedRoute, PublicOnlyRoute
  utils/        formatting, daily-series gap filling, form error mapping
```

## Adding Sell and Inventory next
1. Add `src/api/transactions.js` (`createTransaction`, sending an `Idempotency-Key`) and extend `src/api/products.js` (create, update, adjust stock).
2. Create `src/pages/SellPage.jsx` and `src/pages/InventoryPage.jsx`.
3. In `src/App.jsx` replace the `<ComingSoonPage />` element for `/sell` and `/inventory`.
4. In `src/config/navigation.js` set `built: true` for those items. No layout changes are needed.
5. After a sale, invalidate the `['dashboard']`, `['transactions']` and `['products']` query keys.

## Manual test checklist
- [ ] Opening `/` while logged out redirects to `/login`
- [ ] Empty login submit shows field errors; wrong password shows "Wrong email or password"
- [ ] Register: required fields, 8-character password rule; server 422 errors appear under the right field
- [ ] Submit buttons show a spinner and cannot be double-clicked
- [ ] After login you land on the dashboard; refreshing the page keeps you signed in (silent refresh, no login screen)
- [ ] Closing the tab and reopening keeps you signed in until the refresh token expires or you sign out
- [ ] After 15 minutes (or with `JWT_EXPIRES_IN=30s` on the backend) the dashboard keeps working: the token refreshes silently
- [ ] Sign out returns to login; reopening the app shows the login screen (the cookie is gone)
- [ ] Today / This week / This month tabs reload the numbers
- [ ] A brand-new business shows the Get started checklist and empty states
- [ ] Low-stock card lists products at or below reorder level
- [ ] Stop the backend: dashboard shows an error with "Try again"; start it and retry works
- [ ] 375px wide phone: bottom navigation, no sideways scrolling, amounts not cut off
- [ ] Keyboard: Tab reaches every control with a visible focus ring; "Skip to content" appears on first Tab

## Known limitations
- Sell, Stock, Transactions, Expenses, Messages, Settings and Billing are placeholders ("coming in the next release").
- Email verification and password reset are not built (also not built in the backend).
- No live updates: the dashboard refetches every 45 s and when the tab regains focus (SSE is planned for P7).
- Dashboard "Running low" and "Recent activity" use `GET /products?lowStock=true` and `GET /transactions?limit=6`,
  because `/dashboard/summary` only returns `lowStockCount`.
- Currency is shown as `UGX 45,000` (handoff examples) rather than Intl's default `USh`.
- Only English strings; they are not yet extracted for translation.
