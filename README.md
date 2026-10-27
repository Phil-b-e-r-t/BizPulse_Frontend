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

1. Start the backend (see the handoff, section 2). Check `http://localhost:5000/health`.
2. In `.env` set `VITE_API_URL=http://localhost:5000/api/v1`.
3. Make sure the backend's `CORS_ORIGINS` includes `http://localhost:5173` (default) and every deployed frontend URL.
4. Restart `npm run dev` after any `.env` change.

### No backend yet? Use sample data
Set `VITE_USE_MOCKS=true` in `.env` and restart. A yellow "Sample data" banner shows while this is on.
- Populated demo business: `demo@bizpulse.test` / `demo12345`
- Registering any new account gives an empty business (to see empty states and the onboarding checklist)
- Wrong password gives `INVALID_CREDENTIALS`; clearing the token in sessionStorage gives the expired-session flow

### Refresh tokens
The handoff says there are none; the team says they now exist. The endpoint path is not documented, so it is configurable:
set `VITE_AUTH_REFRESH_PATH` (relative to `VITE_API_URL`). If login returns a `refreshToken`, the client stores it
(sessionStorage) and on a 401 `INVALID_TOKEN` calls `POST <path>` with `{ "refreshToken": "..." }`, expecting
`{ token, refreshToken? }`. If it fails or the variable is empty, the user is sent to login. Confirm the real path and
body with the backend team and adjust `tryRefresh()` in `src/api/client.js` if they differ.

## Where to put images
`public/brand/logo.png`, `public/brand/favicon.png`, optional `public/brand/auth-hero.jpg` (see `public/brand/README.txt`).

## Structure
```
src/
  api/          fetch client, session storage, error mapping, one file per backend area
  components/   Logo, FormAlert, ui/ (Button, Field, Toast, Skeleton, EmptyState, ErrorState, Badge, Spinner)
  config/       env.js, navigation.js (role-aware menu)
  context/      AuthContext (token, user, business, login/register/logout)
  features/     dashboard/ (metric cards, chart, channels, products, low stock, activity, onboarding)
  hooks/        TanStack Query hooks
  layouts/      AuthLayout, AppLayout, Sidebar, BottomNav, UserMenu
  mocks/        MSW sample data (only loaded when VITE_USE_MOCKS=true)
  pages/        Login, Register, Dashboard, More, ComingSoon
  routes/       ProtectedRoute, PublicOnlyRoute
  utils/        formatting, daily-series gap filling, form error mapping
```

## Adding Sell and Inventory next
1. Add `src/api/transactions.js` (`createTransaction`) and extend `src/api/products.js` (create, update, adjust stock).
2. Create `src/pages/SellPage.jsx` and `src/pages/InventoryPage.jsx`.
3. In `src/App.jsx` replace the `<ComingSoonPage />` element for `/sell` and `/inventory`.
4. In `src/config/navigation.js` set `built: true` for those items. No layout changes are needed.
5. After a sale, invalidate the `['dashboard']`, `['transactions']` and `['products']` query keys.

## Manual test checklist
- [ ] Opening `/` while logged out redirects to `/login`
- [ ] Empty login submit shows field errors; wrong password shows "Wrong email or password"
- [ ] Register: required fields, 8-character password rule; server 422 errors appear under the right field
- [ ] Submit buttons show a spinner and cannot be double-clicked
- [ ] After login you land on the dashboard; refreshing the page keeps you signed in (same tab)
- [ ] Closing the tab and reopening requires login again
- [ ] Today / This week / This month tabs reload the numbers
- [ ] A brand-new business shows the Get started checklist and empty states
- [ ] Low-stock card lists products at or below reorder level
- [ ] Stop the backend: dashboard shows an error with "Try again"; start it and retry works
- [ ] Sign out (header menu, or More on mobile) returns to login and `/inventory` is blocked again
- [ ] 375px wide phone: bottom navigation, no sideways scrolling, amounts not cut off
- [ ] Keyboard: Tab reaches every control with a visible focus ring; "Skip to content" appears on first Tab

## Known limitations
- Sell, Stock, Transactions, Expenses, Messages, Settings and Billing are placeholders ("coming in the next release").
- Email verification and password reset are not built (the handoff lists them as not built in the backend).
- No live updates: the dashboard refetches every 45 s and when the tab regains focus (SSE is planned for P7).
- Dashboard "Running low" and "Recent activity" use `GET /products?lowStock=true` and `GET /transactions?limit=6`,
  because `/dashboard/summary` only returns `lowStockCount`.
- Currency is shown as `UGX 45,000` (handoff examples) rather than Intl's default `USh`.
- Only English strings; they are not yet extracted for translation.
