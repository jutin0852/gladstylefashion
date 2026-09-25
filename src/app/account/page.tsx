import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { customerAddresses, orders } from "@/lib/schema";
import { AccountDashboard } from "@/components/account/account-dashboard";
import SignOutButton from "@/components/auth/signOut";
import { OrderHistory } from "@/components/account/order-history";

export default async function AccountPage() { const currentUser = await getSessionUser(); if (!currentUser) redirect("/account/sign-in"); const addresses = await db.select().from(customerAddresses).where(eq(customerAddresses.userId, currentUser.id)).orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt)); const customerOrders = await db.query.orders.findMany({ where: eq(orders.userId, currentUser.id), with: { items: true }, orderBy: [desc(orders.createdAt)] }); return <main className="min-h-screen bg-white text-[#111]"><header className="flex items-center justify-between gap-4 border-b border-black px-5 py-4 sm:px-10"><Link href="/" className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#d3146d] underline">Back to store</Link><SignOutButton /></header><AccountDashboard account={currentUser} addresses={addresses} orderCount={customerOrders.length}/>{customerOrders.length > 0 && <OrderHistory orders={customerOrders.map((order) => ({ id: order.id, orderNumber: order.orderNumber, createdAt: order.createdAt, status: order.status, totalAmount: order.totalAmount, items: order.items.map((item) => ({ id: item.id, productName: item.productName, productImage: item.productImage, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice, size: item.size })) }))} />}</main>; }
