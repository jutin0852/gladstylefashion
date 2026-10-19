import { formatDocumentNumber, methodLabel, nairaToWords, sumAmounts } from "@/lib/invoice-math";
import { formatKobo, parseNairaToKobo } from "@/lib/money";

export const SHOP = {
  addressLines: ["6A, 5th Avenue Opposite,", "Victory Park Osapa London. Lekki, Lagos."],
  phones: "Tel: 08023297930, 07038221773",
};

const PINK = "#f4c6dc";
const INK = "#1d1b2c";
const BRAND = "#b0124f";

/** "130000.00" -> "130,000" for the table cells (the column header carries the naira sign). */
function figure(amount: string) {
  return formatKobo(parseNairaToKobo(amount)).replace("₦", "");
}

function longDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

/** The owner's signature, sitting on the "For: Glad Style Fashion" line. */
function OwnerSignature() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/owner-signature.png" alt="Signed for Glad Style Fashion" className="absolute bottom-full right-4 mb-0.5 h-[72px] w-auto" />
  );
}

export function SheetHeader({ number }: { number: number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/glad-style-fashion-logo-transparent.png" alt="Glad Style Fashion" className="h-[72px] w-auto" />
      <div className="text-right text-[12px] font-semibold leading-snug" style={{ color: INK }}>
        {SHOP.addressLines.map((line) => <p key={line}>{line}</p>)}
        <p>{SHOP.phones}</p>
        <p className="mt-1 font-mono text-[15px] tracking-widest">№ {formatDocumentNumber(number)}</p>
      </div>
    </div>
  );
}

export interface InvoiceSheetData {
  number: number;
  customerName: string;
  customerPhone?: string | null;
  date: Date | string;
  sections: { title: string | null; items: { description: string; quantity: number | null; amount: string }[] }[];
  total: string;
  paid: string;
  balance: string;
  notes?: string | null;
  payments?: { receiptNumber: number; date: Date | string; amount: string; method: string; bank?: string | null }[];
  voided?: boolean;
}

const MIN_ROWS = 8;
const COLUMNS = "grid-cols-[52px_1fr_64px_140px]";

export function InvoiceSheet({ id = "invoice-sheet", data }: { id?: string; data: InvoiceSheetData }) {
  const grouped = data.sections.length > 1;
  const rowsUsed = data.sections.reduce((count, section) => count + section.items.length + (grouped ? 2 : 0), 0);
  const blanks = Math.max(0, MIN_ROWS - rowsUsed);
  const hasPayments = parseNairaToKobo(data.paid) > BigInt(0);
  return (
    <div id={id} className="relative w-[680px] max-w-none bg-white p-8 text-[14px]" style={{ color: INK }}>
      {data.voided && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="-rotate-12 border-4 px-6 py-2 text-6xl font-black tracking-widest opacity-25" style={{ color: BRAND, borderColor: BRAND }}>VOID</span>
        </div>
      )}
      <SheetHeader number={data.number} />

      <div className="mt-5 grid grid-cols-[1fr_250px] gap-4">
        <div className="min-h-[74px] rounded-2xl border-2 px-3 py-2" style={{ borderColor: INK }}>
          <p className="text-[12px] font-bold">Name</p>
          <p className="mt-1 text-lg font-medium">{data.customerName}</p>
          {data.customerPhone && <p className="text-[12px] text-neutral-600">{data.customerPhone}</p>}
        </div>
        <div className="rounded-2xl border-2 text-[13px]" style={{ borderColor: INK }}>
          <div className="grid grid-cols-[72px_1fr] border-b-2" style={{ borderColor: INK }}>
            <p className="border-r-2 px-2 py-1.5 font-bold" style={{ borderColor: INK }}>Date:</p>
            <p className="px-2 py-1.5">{longDate(data.date)}</p>
          </div>
          <div className="grid grid-cols-[72px_1fr]">
            <p className="border-r-2 px-2 py-1.5 font-bold" style={{ borderColor: INK }}>Invoice:</p>
            <p className="px-2 py-1.5 font-mono">{formatDocumentNumber(data.number)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border-2" style={{ borderColor: INK }}>
        <div className={`grid ${COLUMNS} border-b-2 text-center text-[12px] font-bold`} style={{ borderColor: INK }}>
          <p className="border-r-2 py-2" style={{ borderColor: INK }}>Item</p>
          <p className="border-r-2 py-2" style={{ borderColor: INK }}>Description of Goods</p>
          <p className="border-r-2 py-2" style={{ borderColor: INK }}>Qty.</p>
          <p className="py-2" style={{ background: PINK }}>Amount ₦</p>
        </div>
        {data.sections.map((section, sectionIndex) => {
          const subtotal = sumAmounts(section.items.map((item) => item.amount));
          return (
            <div key={sectionIndex}>
              {grouped && (
                <div className="border-b px-3 py-2 text-[13px] font-bold uppercase tracking-wide" style={{ borderColor: INK, background: "#fbeaf2" }}>
                  Garment {sectionIndex + 1}{section.title ? ` · ${section.title}` : ""}
                </div>
              )}
              {section.items.map((item, index) => (
                <div key={index} className={`grid min-h-[40px] ${COLUMNS} border-b`} style={{ borderColor: INK }}>
                  <p className="border-r py-2 text-center" style={{ borderColor: INK }}>{index + 1}</p>
                  <p className="border-r px-3 py-2" style={{ borderColor: INK }}>{item.description}</p>
                  <p className="border-r py-2 text-center" style={{ borderColor: INK }}>{item.quantity ?? ""}</p>
                  <p className="py-2 pr-3 text-right font-medium" style={{ background: PINK }}>{figure(item.amount)}</p>
                </div>
              ))}
              {grouped && (
                <div className={`grid min-h-[36px] ${COLUMNS} border-b`} style={{ borderColor: INK }}>
                  <p className="col-span-3 border-r px-3 py-2 text-right text-[12px] font-semibold" style={{ borderColor: INK }}>
                    Garment {sectionIndex + 1} subtotal
                  </p>
                  <p className="py-2 pr-3 text-right font-semibold" style={{ background: PINK }}>{figure(subtotal)}</p>
                </div>
              )}
            </div>
          );
        })}
        {Array.from({ length: blanks }).map((_, index) => (
          <div key={`blank-${index}`} className={`grid h-[40px] ${COLUMNS} border-b last:border-b-0`} style={{ borderColor: INK }}>
            <span className="border-r" style={{ borderColor: INK }} />
            <span className="border-r" style={{ borderColor: INK }} />
            <span className="border-r" style={{ borderColor: INK }} />
            <span style={{ background: PINK }} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        <p className="text-lg font-bold" style={{ color: BRAND }}>Total ₦</p>
        <p className="min-w-[170px] border-2 px-3 py-1.5 text-right text-lg font-semibold" style={{ borderColor: INK }}>{figure(data.total)}</p>
      </div>

      {hasPayments && (
        <div className="mt-3 space-y-1 text-[13px]">
          <p className="text-[12px] font-bold uppercase tracking-wide">Payments received</p>
          {(data.payments ?? []).map((payment) => (
            <div key={payment.receiptNumber} className="flex justify-between gap-4 border-b border-dotted pb-1" style={{ borderColor: INK }}>
              <span>
                {longDate(payment.date)} · {methodLabel(payment.method)}{payment.bank ? ` (${payment.bank})` : ""} · Receipt {formatDocumentNumber(payment.receiptNumber)}
              </span>
              <strong>{formatKobo(parseNairaToKobo(payment.amount))}</strong>
            </div>
          ))}
          <div className="flex justify-end gap-6 pt-1">
            <p>Paid so far: <strong>{formatKobo(parseNairaToKobo(data.paid))}</strong></p>
            <p>Balance: <strong>{formatKobo(parseNairaToKobo(data.balance))}</strong></p>
          </div>
        </div>
      )}

      <div className="mt-4 border-b-2 pb-1" style={{ borderColor: INK }}>
        <span className="text-[13px] font-semibold">Amount in words </span>
        <span className="text-[15px] italic">{nairaToWords(data.total)}</span>
      </div>

      {data.notes && <p className="mt-3 text-[12px] text-neutral-600">Note: {data.notes}</p>}

      <div className="mt-24 grid grid-cols-2 gap-16 text-[12px] font-semibold">
        <div className="border-t-2 pt-1" style={{ borderColor: INK }}>Customer&apos;s Signature</div>
        <div className="relative border-t-2 pt-1 text-right" style={{ borderColor: INK }}>
          <OwnerSignature />
          For: Glad Style Fashion
        </div>
      </div>
    </div>
  );
}

export interface ReceiptSheetData {
  number: number;
  date: Date | string;
  receivedFrom: string;
  amount: string;
  beingPaymentFor: string;
  method: string;
  bank?: string | null;
  chequeNumber?: string | null;
  balanceAfter: string;
  invoiceNumber: number;
  voided?: boolean;
}

export function ReceiptSheet({ id = "receipt-sheet", data }: { id?: string; data: ReceiptSheetData }) {
  const owing = parseNairaToKobo(data.balanceAfter) > BigInt(0);
  return (
    <div id={id} className="relative w-[760px] max-w-none bg-white p-8 text-[15px]" style={{ color: INK }}>
      {data.voided && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="-rotate-12 border-4 px-6 py-2 text-6xl font-black tracking-widest opacity-25" style={{ color: BRAND, borderColor: BRAND }}>VOID</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/glad-style-fashion-logo-transparent.png" alt="Glad Style Fashion" className="h-[72px] w-auto" />
        <div className="text-right text-[12px] font-semibold leading-snug">
          {SHOP.addressLines.map((line) => <p key={line}>{line}</p>)}
          <p>{SHOP.phones}</p>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <p className="font-serif text-4xl">Receipt</p>
        <p className="font-mono text-lg tracking-widest">№ {formatDocumentNumber(data.number)}</p>
        <p className="font-semibold">Date <span className="ml-2 inline-block min-w-[160px] border-b-2 px-1 text-center font-normal" style={{ borderColor: INK }}>{longDate(data.date)}</span></p>
      </div>

      <div className="mt-6 space-y-4">
        <Line label="Received from" value={data.receivedFrom} />
        <Line label="The Sum of" value={nairaToWords(data.amount)} />
        <Line label="Being payment for" value={data.beingPaymentFor} />
        <div className="grid grid-cols-[1fr_230px] items-end gap-6">
          <div className="space-y-4">
            <Line label="Paid by" value={methodLabel(data.method)} />
            <Line label="Cheque No." value={data.chequeNumber ?? ""} />
            <Line label="Bank" value={data.bank ?? ""} />
          </div>
          <div className="px-4 py-4" style={{ background: PINK }}>
            <p className="text-3xl font-bold">{formatKobo(parseNairaToKobo(data.amount))}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide">
              {owing ? `Balance owing ${formatKobo(parseNairaToKobo(data.balanceAfter))}` : "Paid in full"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-neutral-600">Against invoice {formatDocumentNumber(data.invoiceNumber)}</p>

      <div className="mt-24 grid grid-cols-2 gap-16 text-[12px] font-semibold">
        <div className="border-t-2 pt-1" style={{ borderColor: INK }}>Client Signature</div>
        <div className="relative border-t-2 pt-1 text-right" style={{ borderColor: INK }}>
          <OwnerSignature />
          For: Glad Style Fashion
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end gap-3">
      <span className="whitespace-nowrap font-semibold">{label}</span>
      <span className="min-h-[26px] flex-1 border-b-2 px-1 italic" style={{ borderColor: INK }}>{value}</span>
    </div>
  );
}
