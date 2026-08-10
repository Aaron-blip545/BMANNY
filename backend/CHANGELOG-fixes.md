# Backend Bug Fixes — Changelog

Everything below was found by reading the actual code (not guessed), then
fixed. Each entry says what was wrong, why it would have broken, and what
changed. Search each file for `FIXED:` comments to find the exact lines.

---

## 1. Migration mix-up: `orders` table never actually existed (BLOCKING)

`database/migrations/2026_08_02_062223_create_orders_table.php` was creating
an `order_items` table instead of `orders` (its own `down()` method still
said `dropIfExists('orders')` — a tell that this was a copy-paste slip, not
intentional). Meanwhile the *actual* `order_items` migration
(`2026_08_02_091053_create_order_items_table.php`) only created an empty
table with an id and timestamps — no real columns.

**Effect if left unfixed:** running `php artisan migrate` would either fail
outright (duplicate table) or leave you with no `orders` table at all, which
every Order-related feature depends on.

**Fix:** swapped the content into the correct files. `orders` now has
`client_id`, `quotation_id`, `internal_tracking_number`, `total_amount`,
`status`. `order_items` now has `order_id`, `product_id`, `quantity`,
`unit_price`. The existing filenames/timestamps already happened to be in a
working order, so no renaming was needed — just fixing what's inside each one.

---

## 2. `inquiries.client_id` was pointing at the wrong table

The migration had `user_id` (referencing `users` directly). Every other
part of the schema — `BusinessClient`, `Order` — treats a customer as a
`business_clients.client_id`, not a raw `users.user_id`.

**Fix:** migration now uses `client_id` referencing `business_clients`.
`InquiryController` updated to match (was sending `business_client_id`,
which didn't exist as a column anywhere).

---

## 3. Invalid status strings that would fail on insert

Several places tried to save a status value that isn't in that column's
allowed list (its `enum`). MySQL rejects values outside the enum.

| File | Was | Should be | Valid values |
|---|---|---|---|
| InquiryController | `'Pending Review'` | `'pending'` | pending, reviewed, responded, closed |
| QuotationController (store) | `'Pending Approval'` | `'sent'` | draft, sent, accepted, rejected |
| QuotationController (after quote sent) | `'Quoted'` | `'responded'` | pending, reviewed, responded, closed |
| OrderController (create order) | `'Processing'` | `'processing'` | pending, processing, completed, cancelled |
| OrderController (quotation accepted) | `'Approved'` | `'accepted'` | draft, sent, accepted, rejected |

---

## 4. `quotations.item_details` was required, but nothing fills it in

The column had no `->nullable()`, but `QuotationController::store()` never
sets it. Saving a quotation would fail with a "doesn't have a default
value" database error.

**Fix:** made it nullable for now. Once you design what a line-item
breakdown should look like, populate it for real instead of leaving it null.

---

## 5. `OrderController` validation referenced a column that doesn't exist

`'exists:business_clients,business_client_id'` — but `business_clients`'
primary key is `client_id` (confirmed in both its migration and its Model).
This validation rule could never pass. Fixed to check the real column.

---

## 6. `QuotationController::show()` called a relationship that didn't exist

`Quotation::whereHas('inquiry', ...)` requires an `inquiry()` method on the
`Quotation` model. The model was an empty stub (`class Quotation extends
Model {}`) with no relationships, no `$primaryKey`, no `$fillable`.

**Fix:** filled in `Quotation` (and `Inquiry`, which had the same gap —
missing `$primaryKey = 'inquiry_id'`, which risks silent bugs later if
anything ever calls `Inquiry::find()` or uses route-model-binding on it).

---

## 7. Security: public registration let anyone self-assign a staff role

`AuthController::register()` did `'role' => $request->role ?? 'customer'` —
anyone calling `/register` could include `"role": "admin"` in the request
body and create themselves an admin account. No authentication required.

**Fix:** registration now always creates `role: customer`, unconditionally.
Staff accounts (sales_agent, product_controller, order_manager, admin)
should only be creatable by an existing Admin through a protected endpoint —
that endpoint doesn't exist yet (see "What's still missing" below).

---

## What's still missing (not bugs — just not built yet)

1. **Nothing creates a `business_clients` row.** `AuthController::register()`
   only creates a `users` row. But `InquiryController` now correctly requires
   a real `client_id` from `business_clients` to exist first. **Right now, a
   freshly registered customer cannot submit an inquiry**, because they have
   no business profile yet. This is the single most important next thing to
   build — a `BusinessClientController` (or extending `register()`) so
   signup actually creates both rows.
2. **No endpoint lets an Admin create staff accounts** (sales_agent,
   product_controller, order_manager) — needed now that public
   self-registration is locked to `customer` only.
3. `frontend-web` and `frontend-mobile` are still not calling this API at
   all yet (see the earlier summary) — that's the next phase after this.
