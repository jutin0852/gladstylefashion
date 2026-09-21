import PolicyPage from "../../components/store/policy-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & exchanges", description: "Glad Style Fashion returns and exchanges policy for ready-to-wear purchases." };

export default function ReturnsExchangesPage() {
  return <PolicyPage eyebrow="Glad Style Fashion policies" title="Returns & exchanges" intro="We want you to feel confident in your purchase. Please read these terms before ordering a ready-to-wear item." sections={[
    { title: "Requesting help", paragraphs: ["If you need to request a return or exchange, contact Glad Style Fashion with your order number, the item name, and clear photographs if there is a fault or delivery issue. Requests are reviewed before an item is sent back."] },
    { title: "Eligible items", paragraphs: ["To be considered, an item must be unworn, unwashed, unaltered, and returned with its original tags and packaging where provided. We may decline a request if an item does not meet these conditions."], bullets: ["The item must be in its original condition.", "Proof of purchase is required.", "Return shipping arrangements are confirmed once the request is approved."] },
    { title: "Size and fit", paragraphs: ["Please use the size guide and product information before purchasing. Our team can help with fitting questions before an order is confirmed. Because fit is personal, an exchange is subject to availability and approval."] },
    { title: "Faulty or incorrect items", paragraphs: ["If we send an incorrect item or your item arrives with a verified fault, contact us promptly. Once reviewed, we will advise whether an exchange, repair, replacement, or refund is appropriate."] },
    { title: "Changes and cancellations", paragraphs: ["Contact us as quickly as possible if you need to change or cancel an order. Requests can only be considered before the order enters processing or dispatch."] },
  ]} />;
}
