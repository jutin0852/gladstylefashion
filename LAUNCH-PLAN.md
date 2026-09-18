# Glad Style Fashion launch plan

## Objective

Bring an existing clothing business online, starting with ready-made outfits that customers can buy from available stock. Connect the website, Instagram content, and marketing to fulfilled, profitable orders. Add custom clothing later.

## Confirmed business inputs

- Confirmed brand name: Glad Style Fashion.
- Initial markets: Lagos, the United Kingdom, and the United States.
- Physical garments are available. Product photos are not yet available; the owner will photograph the garments as references for realistic AI model imagery.
- Product prices, sizes, and quantities still need to be supplied.
- Shipping rates, delivery estimates, and customs responsibilities still need definition before enabling international destinations at checkout.

## Decisions still needed

- Obtain product details; confirm customer profile and checkout currency for Lagos, UK, and US buyers.
- Choose the first collection and record prices, costs, stock by size/color, measurements, and photos.
- Confirm delivery partner, charges, dispatch time, returns/exchanges, and customer support contact.
- Agree on launch budget, who handles orders/content, and a realistic launch date.

## Current code: initial inspection, not a production audit

- Next.js storefront, product details, cart, checkout, and admin screens exist.
- Homepage currently includes stock imagery, seasonal placeholder copy, and an unconfirmed $150 free-delivery offer.
- The inspected order action validates catalog prices and reduces inventory, but does not collect payment.
- Checkout promises an email; the inspected order action does not send one. Verify or implement notifications before making this promise.
- Inventory is currently stored per product, with a list of sizes. Ready-made selling needs availability per size/color to avoid selling a size that is out of stock.
- Live database, deployment, payment, and fulfillment behavior have not been verified.

## Delivery sequence

### 1. Define the first collection

Start with a manageable selection; a proposed target is 5–10 pieces if stock supports it. For each piece collect: name, SKU, price, production cost, sizes, garment measurements, color, fabric, care, quantity per variant, and dispatch time. Separate stocked pieces from made-to-order products.

### 2. Build a trustworthy mobile storefront

Use real product photography, readable prices, straightforward categories, and a strong shop call to action. Product pages should show front/back/detail photos, fit and size guidance, stock, delivery terms, and exchanges. Include the auntie's real business story and a working support contact. Confirm currency before changing prices or formatting.

Design references to discuss:

- https://zephansandco.com/ — collection/category presentation.
- https://zephansandco.com/shop/ — size filters and garment descriptions including fabric and model sizing.
- https://jessiesrtw.com/ — visible shop and WhatsApp entry points.

Borrow useful shopping patterns while developing an original visual identity from the actual clothes.

### 3. Complete ordering and operations

Implement the agreed payment method and verified payment status; never treat an unverified checkout redirect as payment proof. Handle stock reservations, failed/abandoned payments, duplicate submissions, and cancellations. Show delivery cost before order submission. Confirm customer and seller notifications and the packing/dispatch workflow.

Launch gate: complete a mobile test purchase, payment failure, sold-out variant, duplicate submission, and cancellation/refund workflow; confirm the seller can find and fulfill the order. Review admin access and customer data handling before going public.

### 4. Produce product content

Capture actual garments in daylight: front, back, fabric close-up, fit, and a short movement video. Keep a consistent background and crop. Use AI-assisted images for campaign concepts and supplementary styling only after comparison with the real garment; preserve cut, print, color, seams, and length. Keep actual product photos on product pages so customers can assess what they will receive.

First image workflow: photograph one pressed garment against a plain background in indirect daylight, capturing the entire front, back, side, and close-ups of fabric and construction details. A mannequin or willing wearer helps show drape. Use unfiltered originals as generation references. Produce a studio model image first, compare it with the garment for accuracy, then create matching campaign variants. AI-generated fit is illustrative and must not be used as evidence of actual fit or measurements.

Prepare per outfit: one product carousel, one styling/movement reel, story frames with price/sizes and a purchase link, and a caption with a clear call to action. Never invent customer reviews or product claims.

### 5. Soft launch and learn

Proposed initial focus: website as catalog/checkout, Instagram for discovery, and WhatsApp for sales questions. Begin with existing customers and the business's network. Publish product demonstrations, the maker's story, styling ideas, and delivery/size answers. Track where each order came from and resolve shopping friction before expanding channels.

### 6. Test paid promotion

Set an explicit budget before spending. Test a small number of real product creatives and send buyers to the relevant product page. Measure paid orders, acquisition cost, contribution per order, exchanges, and delivered orders rather than judging success by likes. Publishing posts, messaging customers, and spending on ads require explicit direction when execution is ready.

Contribution before advertising = selling price minus garment cost, packaging, payment fees, seller-funded delivery, and expected variable return costs. Set the allowable acquisition cost below this contribution with room for overhead and profit.

## First content sequence

1. Meet the maker: real business story and what the collection offers.
2. First outfit: real photos, price, available sizes, fit, and ordering link.
3. Movement/styling video: show how the outfit looks when worn.
4. Buying guide: measurements, delivery coverage, and exchanges.
5. Collection launch: available pieces and direct shop links.
6. Behind the scenes: making, quality checks, and packing.
7. Customer feedback with permission, once actual orders have arrived.

## Next milestone

Receive reference photos and details for the first garment; confirm audience and choose a visual direction for the Glad Style Fashion storefront and product imagery.
