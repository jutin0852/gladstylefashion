import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db";
import { orderItems, orders, products, user } from "../../schema";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
};

export type AdminAnalytics = {
  cards: {
    totalSales: number;
    totalOrders: number;
    customers: number;
    lowStock: number;
  };
  chart: { date: string; orders: number; revenue: number }[];
  orders: AdminOrder[];
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [sales, orderCount, customerCount, lowStock, recentOrders, dailySales] =
    await Promise.all([
      db
        .select({ total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
        .from(orders)
        .where(eq(orders.paymentStatus, "paid")),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(user),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`coalesce(${products.inventoryCount}, 0) <= 5`,
          ),
        ),
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          totalAmount: orders.totalAmount,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          itemCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        })
        .from(orders)
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .groupBy(orders.id)
        .orderBy(desc(orders.createdAt))
        .limit(100),
      db
        .select({
          date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
          orders: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
        })
        .from(orders)
        .where(gte(orders.createdAt, sql`current_date - interval '90 days'`))
        .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
        .orderBy(sql`date_trunc('day', ${orders.createdAt})`),
    ]);

  return {
    cards: {
      totalSales: Number(sales[0]?.total || 0),
      totalOrders: Number(orderCount[0]?.count || 0),
      customers: Number(customerCount[0]?.count || 0),
      lowStock: Number(lowStock[0]?.count || 0),
    },
    chart: dailySales.map((item) => ({
      date: item.date,
      orders: Number(item.orders),
      revenue: Number(item.revenue),
    })),
    orders: recentOrders.map((order) => ({
      ...order,
      totalAmount: String(order.totalAmount),
      paymentStatus: order.paymentStatus || "pending",
      createdAt: order.createdAt?.toISOString() || "",
      itemCount: Number(order.itemCount),
    })),
  };
}

export async function updateOrderStatus(orderId: string, status: string) {
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}
