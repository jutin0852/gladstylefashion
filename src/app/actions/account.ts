"use server";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/transaction-db";
import { customerAddresses, customerProfiles, orders, user } from "@/lib/schema";
import { getSessionUser } from "@/lib/admin-auth";

async function requireCustomer() { const currentUser = await getSessionUser(); if (!currentUser) throw new Error("Please sign in to continue."); return currentUser; }
const profileSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).optional(), marketingEmailOptIn: z.boolean(), marketingWhatsappOptIn: z.boolean() });
const addressSchema = z.object({ label: z.string().trim().min(1).max(40), recipientName: z.string().trim().min(2).max(100), phone: z.string().trim().min(5).max(30), street: z.string().trim().min(3).max(200), city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100), postalCode: z.string().trim().max(20).optional(), isDefault: z.boolean() });

export async function saveProfile(input: z.infer<typeof profileSchema>) { const currentUser = await requireCustomer(); const data = profileSchema.parse(input); await transactionDb.transaction(async (tx) => { await tx.update(user).set({ name: data.name, phone: data.phone || null, updatedAt: new Date() }).where(eq(user.id, currentUser.id)); await tx.insert(customerProfiles).values({ userId: currentUser.id, marketingEmailOptIn: data.marketingEmailOptIn, marketingWhatsappOptIn: data.marketingWhatsappOptIn, updatedAt: new Date() }).onConflictDoUpdate({ target: customerProfiles.userId, set: { marketingEmailOptIn: data.marketingEmailOptIn, marketingWhatsappOptIn: data.marketingWhatsappOptIn, updatedAt: new Date() } }); }); revalidatePath("/account"); }
export async function saveAddress(input: z.infer<typeof addressSchema>) { const currentUser = await requireCustomer(); const data = addressSchema.parse(input); await transactionDb.transaction(async (tx) => { if (data.isDefault) await tx.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.userId, currentUser.id)); await tx.insert(customerAddresses).values({ ...data, postalCode: data.postalCode || null, country: "Nigeria", userId: currentUser.id }); }); revalidatePath("/account"); }
export async function setDefaultAddress(addressId: number) { const currentUser = await requireCustomer(); await transactionDb.transaction(async (tx) => { await tx.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.userId, currentUser.id)); await tx.update(customerAddresses).set({ isDefault: true }).where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, currentUser.id))); }); revalidatePath("/account"); }
export async function deleteAddress(addressId: number) { const currentUser = await requireCustomer(); await db.delete(customerAddresses).where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, currentUser.id))); revalidatePath("/account"); }
export async function linkVerifiedGuestOrders() { const currentUser = await requireCustomer(); if (!currentUser.emailVerified) return; await db.update(orders).set({ userId: currentUser.id }).where(and(isNull(orders.userId), sql`lower(${orders.customerEmail}) = lower(${currentUser.email})`)); revalidatePath("/account"); }
