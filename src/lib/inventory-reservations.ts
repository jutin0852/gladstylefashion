import { and, eq, sql } from "drizzle-orm";
import type { transactionDb } from "./transaction-db";
import { orders, productVariants, products } from "./schema";

type ReservationTransaction = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];

export const DEFAULT_RESERVATION_MINUTES = 30;

export function getReservationMinutes() {
  const configured = Number(process.env.CHECKOUT_RESERVATION_MINUTES || DEFAULT_RESERVATION_MINUTES);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_RESERVATION_MINUTES;
}

export function getReservationExpiry(now = new Date()) {
  return new Date(now.getTime() + getReservationMinutes() * 60_000);
}

export function isReservationActive(status: string | null | undefined, expiresAt: Date | null | undefined, now = new Date()) {
  return status === "active" && Boolean(expiresAt && expiresAt.getTime() > now.getTime());
}

export type ReservationReleaseReason = "payment_initialization_failed" | "expired";

/**
 * Releases an active reservation exactly once. The caller must be inside a
 * transaction; the order lock serializes this with payment finalization.
 */
export async function releaseInventoryReservation(
  tx: ReservationTransaction,
  orderId: string,
  reason: ReservationReleaseReason,
) {
  await tx.execute(sql`select "id" from "orders" where "id" = ${orderId} for update`);
  const order = await tx.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order || order.reservationStatus !== "active") return false;

  const variantQuantities = new Map<string, number>();
  const legacyQuantities = new Map<string, number>();
  for (const item of order.items) {
    if (item.variantId) variantQuantities.set(item.variantId, (variantQuantities.get(item.variantId) || 0) + item.quantity);
    else if (item.productId) legacyQuantities.set(item.productId, (legacyQuantities.get(item.productId) || 0) + item.quantity);
  }

  for (const [variantId, quantity] of [...variantQuantities.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    await tx.update(productVariants)
      .set({ inventoryCount: sql`${productVariants.inventoryCount} + ${quantity}`, updatedAt: new Date() })
      .where(eq(productVariants.id, variantId));
  }
  for (const [productId, quantity] of [...legacyQuantities.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    await tx.update(products)
      .set({ inventoryCount: sql`coalesce(${products.inventoryCount}, 0) + ${quantity}`, updatedAt: new Date() })
      .where(eq(products.id, productId));
  }

  await tx.update(orders)
    .set({
      paymentStatus: reason === "expired" ? "expired" : "payment_initialization_failed",
      reservationStatus: "released",
      reservationReleasedAt: new Date(),
      reservationReleaseReason: reason,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.reservationStatus, "active")));

  return true;
}

