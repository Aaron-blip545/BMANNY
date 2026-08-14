# This Week — What's Left

**Big change today:** `frontend-web` and `backend` are now merged into ONE
Laravel app (still called `backend`). No more two servers, no more proxy
layer, no more `.env` files to keep in sync. `frontend-mobile` is
untouched — still hits the same `/api/*` routes it always did.

---

## Step 0 — Get the merged app running (do this first)

- [ ] Download `bmanny-merged.zip`, replace your local `backend/` folder
      with the one inside it.
- [ ] `frontend-web/` is no longer used — keep it around for a few days in
      case something needs double-checking, then delete it.
- [ ] In `backend/`: `composer install`, then `npm install`
      (this installs Inertia + React — new for this project, wasn't here before).
- [ ] Add to `.env`: nothing new needed — same MySQL setup as before.
      **Do NOT add `BACKEND_API_URL` anymore — that concept doesn't exist
      now, everything's one app.**
- [ ] `php artisan migrate` — includes one new migration (`is_available`
      on products).
- [ ] Run `php artisan db:seed --class=UserSeeder` again if your test
      accounts aren't already in this database.
- [ ] Three terminals, but only ONE app now: `php artisan serve`,
      `npm run dev` — that's it. No second `php artisan serve --port=8001`
      anymore.
- [ ] Log in, click through Dashboard → Products → Manage Users. Confirm
      nothing broke in the move.

**Tell your groupmate:** the Product Controller task brief I gave them
earlier is now outdated (it explained the old two-project setup). I already
finished Product Controller CRUD as part of this merge — add/edit/deactivate
products all work now. They don't need to build it anymore; point them at
this file instead once Step 0 is confirmed working.

---

## Step 1 — The real blocker (was Day 1–2, still not done)

- [x] **Nothing creates a `business_clients` row when someone registers.**
      Fixed via `UserObserver` — fires on every `User::create()` for customers.
      Covers both the web admin form and the API `/register` route.

## Step 2 — Sales Agent pages (Day 4–5)

- [x] Inquiries list page — `/inquiries` (view what customers submitted, with
      status badges and stats. "Quote" button per row links to quotation form.)
- [x] Quotation creation/send form — `/quotations/create` (pick inquiry from
      dropdown, enter amount + validity, submits and marks inquiry as responded.)

## Step 3 — Order Manager pages (Day 6–7)

- [x] Orders list page — `/orders` (shows all orders with client, amount, status)
- [x] Update production/delivery status — inline dropdown on orders table,
      fires `PATCH /orders/{id}/status`

## Step 4 — Still queued for Week 2 (unchanged from before)

- [ ] Mobile app: wire login/register to the real API (still just a UI
      mockup right now, no network calls)
- [ ] Mobile: inquiry submission + quotation viewing
- [ ] Mobile: order tracking screen
- [ ] Simple Admin reports page
- [ ] Buffer day: test everything together, rehearse demo

---

## Already done (for morale — this was a lot for one day)

- Backend: 9 real bugs fixed (broken migration, security hole, wrong
  column references, invalid status values)
- Password reset, built for real (backend endpoints + working pages)
- Register removed (didn't match your proposal's design anyway)
- Manage Users: full CRUD, restyled properly with the shared component
  library, role-restricted sidebar
- Product Controller: full CRUD, done today as part of the merge
- The whole two-project architecture simplified into one app — this should
  mean noticeably fewer "why is this 404ing" mysteries from here on
