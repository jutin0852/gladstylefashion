# Paystack payment setup

Glad Style Fashion now uses Paystack's hosted checkout for Nigerian naira payments. The store creates an unpaid order first, verifies the completed Paystack transaction on the server, and only then marks the order paid and reduces stock.

## Add the environment variables

Create a Paystack account and use **test** keys while testing. Add these variables in the local `.env` file and Vercel's Production and Preview environments:

```bash
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

`PAYSTACK_SECRET_KEY` stays server-only. Do not add it to client code or make it a `NEXT_PUBLIC_` variable. `NEXT_PUBLIC_APP_URL` must be the exact public site address, without a trailing slash. It is used for the secure return from Paystack after a payment.

When you are ready to accept money, replace the test key with Paystack's live secret key only after your Paystack business account is activated.

## Set the webhook

In Paystack Dashboard, set this webhook URL:

```text
https://your-vercel-domain.vercel.app/api/paystack/webhook
```

The webhook is signature-checked with the same secret key and verifies the transaction again before it changes an order. It also covers cases where a customer closes the browser before returning to the store.

## Test before launch

1. Deploy after adding the two environment variables.
2. Add an in-stock product and complete checkout with a Paystack test payment method.
3. Confirm the return page says “Payment received.”
4. In the admin, confirm the order shows `paid` and the stock count reduced once.
5. Repeat with an abandoned/failed test payment and confirm no stock is reduced.
6. Confirm the webhook URL receives a successful test event in Paystack Dashboard.

Nigeria is the active market, so checkout is fixed to NGN. International cards and currencies can be enabled later after they are approved and configured in the Paystack account.
