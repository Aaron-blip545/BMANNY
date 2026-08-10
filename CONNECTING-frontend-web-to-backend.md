# Connecting frontend-web to backend

## What changed and why

frontend-web (the Laravel + Inertia + React starter kit) came with its
**own** login system and its own `users` table — completely separate from
`backend`'s. That's wrong for this project: `backend` is supposed to be the
one source of truth for who exists and what role they have.

So instead of frontend-web checking its own database when someone logs in,
it now calls `backend`'s `/api/login`, gets back a Sanctum token, and
stores that token in the PHP session. Every page after that uses the stored
token to fetch real data from `backend` — the same way `frontend-mobile`
will, just from server-side PHP instead of the phone.

```
Browser -> frontend-web (Laravel/Inertia) -> backend (Sanctum API) -> MySQL
              (holds the token in session)
```

Nothing in the browser ever talks to `backend` directly — frontend-web's
own Laravel layer does that server-to-server. This avoids CORS setup
entirely and never exposes the API token to client-side JavaScript.

## Files that changed

| File | What changed |
|---|---|
| `app/Services/BackendApi.php` | **New.** One place that knows how to call `backend`, with the token attached automatically. |
| `config/services.php`, `.env.example` | Added `BACKEND_API_URL`. |
| `app/Http/Middleware/EnsureBackendAuthenticated.php` | **New.** Replaces the default `auth` middleware — checks for a stored token instead of a local login. |
| `bootstrap/app.php` | Registered that middleware as `backend.auth`. |
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Login/logout now go through `backend` instead of frontend-web's own `users` table. |
| `app/Http/Middleware/HandleInertiaRequests.php` | Every page now gets the backend-sourced user, not frontend-web's own. |
| `routes/web.php`, `routes/auth.php` | Dashboard + logout now use `backend.auth`. Added `/products`. |
| `app/Http/Controllers/ProductPageController.php`, `resources/js/pages/products/index.tsx` | **New.** A real, working page — proof the connection works. |
| `resources/js/components/app-sidebar.tsx` | "Inventory" nav link now points at `/products`. |

## Deliberately NOT touched yet

- **Register / forgot-password pages** still point at frontend-web's own
  unused `users` table. Fixing them properly needs a `backend` endpoint
  that lets an Admin create staff accounts (see `CHANGELOG-fixes.md` in
  `backend/` — this was already flagged as missing). Don't use frontend-web's
  register page yet; it won't create a real, usable account.
- **Orders / Reports / Inquiries** sidebar links still 404 — they're
  placeholder nav items from the starter kit that were never wired to a
  route. `Products` is the first one actually built.

## How to test it

1. Make sure `backend` is running: in `backend/`, `php artisan serve`
   (defaults to `http://localhost:8000`).
2. In `frontend-web/`, copy the env var: make sure your real `.env` has
   `BACKEND_API_URL=http://localhost:8000/api` (see `.env.example`).
3. Since `backend` is already using port 8000, start frontend-web on a
   different port: `php artisan serve --port=8001`
4. Visit `http://localhost:8001/login` and log in with a real account
   that already exists in `backend`'s database (one you created earlier
   via `/api/register` or directly in phpMyAdmin).
5. You should land on `/dashboard`. Click **Inventory** in the sidebar —
   if you see a real product list (or an empty-but-working table), the
   connection works. If you see the red error box instead, check that
   `backend` is actually running and `BACKEND_API_URL` is correct.
6. Click **Log out** and confirm it actually returns you to the homepage
   instead of getting stuck (this was a real bug in the first draft of
   this fix — logout was still gated behind the old, now-unused Laravel
   guard, which would've silently redirected instead of logging out).

## What to build next

Now that the pattern exists (`BackendApi::get(...)` -> `Inertia::render(...)`
-> React page), adding Inquiries, Orders, and Quotations pages is mostly
repeating this same shape with different endpoints. The one blocker before
Inquiries can work end-to-end: a customer still needs a `business_clients`
row to exist before they can submit one (see `backend/CHANGELOG-fixes.md`).
