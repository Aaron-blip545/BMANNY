# Task: Quotation → Order conversion (web UI)

## The gap, precisely

`SalesAgentController` can create a quotation. `OrderManagerController`
can update an order's status. **Nothing converts one into the other** —
there's no button anywhere on the dashboard that takes an accepted
quotation and turns it into a real order. Right now that can only happen
through a raw API call, which isn't something your Sales Agent can click
during a demo.

This also matches your own Figure 6.1 flowchart exactly: *"Update Lead and
Quotation Status" → if accepted → "Record Confirmed Order Details" →
"Forward Confirmed Order to Order Manager."* That's the Sales Agent's job
in your own design — not the customer clicking something on mobile. So
this isn't a workaround for the mobile app not being wired yet, it's
literally what your proposal already says should happen.

## What to build

**1. A Quotations list page** (doesn't exist yet — only the *create*
form exists, nothing shows what's already been sent).

**2. An "Accept & Create Order" action** on any quotation still in
`sent` status.

## Step 1: `SalesAgentController.php` — add two methods

Add these to the existing controller:

```php
/**
 * List every quotation, with its inquiry/client info, so the Sales Agent
 * can see what's pending and act on it.
 */
public function quotations(): Response
{
    $quotations = Quotation::with(['inquiry.client.user'])
        ->orderByDesc('created_at')
        ->get();

    return Inertia::render('sales/quotations/index', [
        'quotations' => $quotations,
    ]);
}

/**
 * Accept a quotation and create the matching Order - this is the
 * "Record Confirmed Order Details / Forward to Order Manager" step
 * from Figure 6.1.
 */
public function acceptQuotation($id)
{
    $quotation = Quotation::with('inquiry.client')->findOrFail($id);

    if ($quotation->status !== 'sent') {
        return back()->withErrors(['status' => 'Only a sent quotation can be accepted.']);
    }

    \DB::transaction(function () use ($quotation) {
        Order::create([
            'client_id' => $quotation->inquiry->client->client_id,
            'quotation_id' => $quotation->quotation_id,
            'total_amount' => $quotation->total_amount,
            'status' => 'approved', // matches Figure 6.3's first order stage
        ]);

        $quotation->status = 'accepted';
        $quotation->save();
    });

    return redirect()->route('quotations.index')
        ->with('success', 'Order created and forwarded to Order Manager.');
}
```

Add the imports at the top: `use App\Models\Order;`

## Step 2: `routes/web.php` — add the two routes

Inside the same `sales_agent,admin`-restricted group as `inquiries` and
`quotations.create`, add:

```php
Route::get('quotations', [SalesAgentController::class, 'quotations'])->name('quotations.index');
Route::post('quotations/{id}/accept', [SalesAgentController::class, 'acceptQuotation'])->name('quotations.accept');
```

## Step 3: New page — `resources/js/pages/sales/quotations/index.tsx`

Match the existing style used in `sales/inquiries.tsx` and
`orders/index.tsx` (same table pattern, same status badge approach) —
whoever built those already established the visual language for this
project, so mirror it rather than introducing a different look. The page
needs:

- A table: Client name, Inquiry summary, Total amount, Status, Sent date
- For rows where `status === 'sent'`: an "Accept & Create Order" button
  that POSTs to `quotations.accept` (with a `confirm()` prompt first,
  same pattern as the toggle-active/toggle-available buttons elsewhere
  in this project)
- For `accepted`/`rejected` rows: just show the status badge, no action

## Step 4: Sidebar link

In `app-sidebar.tsx`, in the same `sales_agent`/`admin`-restricted section
as the existing "Inquiries" link, add:

```js
{ title: 'Quotations', url: '/quotations', icon: FileText }
```
(check whichever icon import style the rest of that file already uses)

---

## How to test it

1. As a sales agent, create a quotation for a real inquiry (needs
   business_clients fix done first, or use existing test data).
2. Go to the new Quotations page — confirm it shows up as `sent`.
3. Click Accept & Create Order.
4. Go to the Orders page (Order Manager) — confirm the new order appears
   with status `approved`, correct client, correct amount.
5. Confirm clicking Accept a second time on an already-accepted quotation
   is blocked (shouldn't create a duplicate order).
