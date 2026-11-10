# Super admin: what the backend must provide

The screens under `/admin/*` are built and work against sample data (`VITE_USE_MOCKS=true`).
Endpoints are listed in `src/api/admin.js`; the sample behaviour in `src/mocks/adminHandlers.js` shows the expected request and response shapes.

## Rules the server must enforce (the UI checks are only for convenience)
- Role `superadmin` on every `/admin/*` route. Login response `user.role = "superadmin"`, `business = null`.
- **Inactivity**: expire a session after `settings.session.inactivityTimeoutHours` (default 24) without meaningful activity. Do NOT count requests with header `X-BizPulse-Heartbeat: 1` (the app pings `/auth/me` each minute). Refresh must fail with code `SESSION_EXPIRED_INACTIVITY`.
- **Terminated / suspended**: return 401 `SESSION_TERMINATED` or `ACCOUNT_SUSPENDED` on the next request, and on `/auth/refresh`. Login for a suspended account: `ACCOUNT_SUSPENDED`.
- **Lockout**: after `maxFailedLogins` failures lock for `lockoutMinutes`; respond 423 `ACCOUNT_LOCKED` with a readable `message` that includes the remaining time.
- Suspension, restore, lock, unlock and session termination require a `reason`; store admin id, reason and timestamp.
- **Audit log**: append-only. No update or delete endpoint, and revoke UPDATE/DELETE on the table for the app's DB role. Never log passwords, tokens or refresh cookies.
- Money totals in `/admin/finance/summary`, `/admin/overview` and `/admin/reports/*` must be computed in SQL from invoice and payment rows. Use transactions for subscription, invoice and payment changes.
- Validate all input server-side (the 422 `VALIDATION_ERROR` shape with `details: [{ path, message }]` is already handled by the forms).

## Open decisions
- Invoice and report PDFs are produced in the browser (print to PDF). Switch to server-generated files if you need a fixed layout or stored copies.
