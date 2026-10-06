import { and, eq, isNotNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/transaction-db";
import { orders } from "@/lib/schema";
import { releaseInventoryReservation } from "@/lib/inventory-reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expiredOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "pending"), eq(orders.reservationStatus, "active"), isNotNull(orders.reservationExpiresAt), lte(orders.reservationExpiresAt, new Date())))
    .limit(50);

  let released = 0;
  for (const order of expiredOrders) {
    const didRelease = await transactionDb.transaction((tx) => releaseInventoryReservation(tx, order.id, "expired"));
    if (didRelease) released += 1;
  }

  return NextResponse.json({ scanned: expiredOrders.length, released });
}
