import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { orders, user } from "../../schema";

export type AdminCustomer = {
  email: string;
  name: string;
  phone: string | null;
  orderCount: number;
  totalSpent: string;
  latestOrderAt: Date | null;
  registered: boolean;
};

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const rows = await db
    .select({
      email: orders.customerEmail,
      name: sql<string>`max(${orders.customerName})`,
      phone: sql<string | null>`max(${orders.customerPhone})`,
      orderCount: sql<number>`count(${orders.id})`,
      totalSpent: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
      latestOrderAt: sql<Date | null>`max(${orders.createdAt})`,
      userId: user.id,
    })
    .from(orders)
    .leftJoin(user, eq(user.email, orders.customerEmail))
    .groupBy(orders.customerEmail, user.id)
    .orderBy(desc(sql`max(${orders.createdAt})`));
  return rows.map((row) => ({ ...row, orderCount: Number(row.orderCount), totalSpent: String(row.totalSpent), registered: Boolean(row.userId) }));
}

export async function getAdminCustomer(email: string) {
  const [profile, customerOrders] = await Promise.all([
    db.select({ id: user.id, name: user.name, phone: user.phone, createdAt: user.createdAt }).from(user).where(eq(user.email, email)).limit(1),
    db.query.orders.findMany({ where: eq(orders.customerEmail, email), with: { items: true }, orderBy: [desc(orders.createdAt)] }),
  ]);
  if (!customerOrders.length) return null;
  const totalSpent = customerOrders.reduce((total, order) => total + Number(order.totalAmount), 0);
  return { email, name: customerOrders[0].customerName, phone: customerOrders.find((order) => order.customerPhone)?.customerPhone || profile[0]?.phone || null, registeredAt: profile[0]?.createdAt || null, totalSpent, orders: customerOrders };
}
