import { z } from "zod";
import { BANKS, INVOICE_METHODS, isWholeNaira } from "./invoice-math";

const wholeNaira = z
  .string()
  .trim()
  .refine((value) => value === "" || (isWholeNaira(value) && value.length <= 12), "Enter a whole naira amount.");

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Describe each item.").max(500),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(10000).nullish(),
  amount: wholeNaira.refine((value) => value !== "", "Enter a price for every item."),
});

export const invoiceSectionSchema = z.object({
  title: optionalText(200),
  items: z.array(invoiceItemSchema).min(1, "Each garment needs at least one item.").max(40),
});

export const invoiceInputSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required.").max(200),
  customerPhone: optionalText(40),
  customerEmail: z.string().trim().max(200).optional().transform((value) => value || undefined)
    .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email."),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  notes: optionalText(1000),
  sections: z.array(invoiceSectionSchema).min(1, "Add at least one garment.").max(20),
});

export const paymentInputSchema = z.object({
  invoiceId: z.string().min(1),
  amount: wholeNaira.refine((value) => value !== "" && Number(value) > 0, "Enter the amount received."),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  method: z.enum(INVOICE_METHODS),
  bank: z.union([z.enum(BANKS), z.literal("")]).optional().transform((value) => value || undefined),
  chequeNumber: optionalText(60),
  receivedFrom: z.string().trim().min(1, "Who paid?").max(200),
  beingPaymentFor: optionalText(300),
}).refine((payment) => payment.method === "cash" || Boolean(payment.bank), {
  message: "Choose which bank the money was paid into.",
  path: ["bank"],
});

export type InvoiceInput = z.input<typeof invoiceInputSchema>;
export type PaymentInput = z.input<typeof paymentInputSchema>;
