# Task: Create a BusinessClient row on registration

## The problem, precisely

`AuthController::register()` currently only creates a `User` row. It never
creates a matching `BusinessClient` row. Every controller that deals with
inquiries (`InquiryController`, `SalesAgentController`, etc.) expects a
customer to have a `client_id` from the `business_clients` table — so
right now, **any newly registered customer has no way to submit an
inquiry at all**. This is the one gap blocking Sales Agent and Order
Manager from being testable end-to-end with a real signup.

## The exact fix

`business_clients` has these columns, and **three of them are required**
(not nullable) — `business_type`, `contact_person`, `business_address`:

```php
$table->id('client_id');
$table->foreignId('user_id')->references('user_id')->on('users')->onDelete('cascade');
$table->string('business_name', 150);
$table->string('business_type', 100);      // REQUIRED
$table->string('contact_person', 100);     // REQUIRED
$table->text('business_address');          // REQUIRED
$table->string('profile_pic', 255)->nullable();
```

So the registration endpoint needs to collect all four business fields,
not just `business_name`. Replace `AuthController::register()` with:

```php
public function register(Request $request)
{
    $request->validate([
        'full_name' => 'required|string|max:100',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:6|confirmed',
        'business_name' => 'required|string|max:150',
        'business_type' => 'required|string|max:100',
        'contact_person' => 'required|string|max:100',
        'business_address' => 'required|string',
    ]);

    // Wrapped in a transaction: if creating the BusinessClient fails for
    // any reason, the User creation rolls back too - we never want a
    // User to exist without a matching business profile.
    $user = \DB::transaction(function () use ($request) {
        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'customer',
        ]);

        $user->businessClient()->create([
            'business_name' => $request->business_name,
            'business_type' => $request->business_type,
            'contact_person' => $request->contact_person,
            'business_address' => $request->business_address,
        ]);

        return $user;
    });

    $token = $user->createToken('bmanny-auth-token')->plainTextToken;

    return response()->json([
        'message' => 'User registered successfully',
        'user' => $user->load('businessClient'),
        'token' => $token,
    ], 201);
}
```

`$user->businessClient()->create([...])` works because that relationship
already exists on the `User` model — it automatically fills in the right
`user_id`, no need to pass it manually.

## How to test it

```
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Customer",
    "email": "customer1@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "business_name": "Test Biz",
    "business_type": "Retail",
    "contact_person": "Test Customer",
    "business_address": "123 Test St, Cagayan de Oro"
  }'
```

Check the response — it should now include a `business_client` object
nested inside `user`, with a real `client_id`. That `client_id` is what
makes inquiry submission actually possible.

Then confirm in phpMyAdmin: a new row should exist in **both** `users`
and `business_clients`, linked by `user_id`.

## One loose end worth knowing about

Any customer accounts already created *before* this fix (through testing
earlier) have a `User` row but no `BusinessClient` row — they're stuck the
same broken way. Easiest fix: just don't worry about them, register fresh
test accounts after this change. If you specifically need to fix an
existing one, insert a matching row into `business_clients` manually via
phpMyAdmin (or delete the old test user and re-register).

## Why this also matters for the mobile app later

Right now `frontend-mobile`'s register screen doesn't call any API yet
(it's still just a UI mockup). When it eventually does, its registration
form will need input fields for all four business fields above, not just
name/email/password — worth knowing now so the mobile form gets designed
right the first time instead of needing a second pass.
