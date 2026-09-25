import CheckoutForm from "../../components/store/checkout-form";
import { getSessionUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { customerAddresses } from "@/lib/schema";
import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Secure checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const currentUser = await getSessionUser();
  const [address] = currentUser ? await db.select().from(customerAddresses).where(and(eq(customerAddresses.userId, currentUser.id), eq(customerAddresses.isDefault, true))).orderBy(desc(customerAddresses.createdAt)).limit(1) : [];
  return <CheckoutForm initialCustomer={currentUser ? { name: currentUser.name, email: currentUser.email, phone: currentUser.phone, street: address?.street, city: address?.city, state: address?.state } : undefined} />;
}
