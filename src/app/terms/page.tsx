import PolicyPage from "../../components/store/policy-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use & sale", description: "Terms that apply when you shop with Glad Style Fashion." };

export default function TermsPage() {
  return <PolicyPage eyebrow="Glad Style Fashion policies" title="Terms of use & sale" intro="These terms apply when you use the Glad Style Fashion website or place an order with us." sections={[
    { title: "Product information", paragraphs: ["We aim to present each item accurately. Colours may appear differently depending on your screen. Product photographs, size guidance, and descriptions should be reviewed before ordering."] },
    { title: "Availability", paragraphs: ["Ready-to-wear pieces are subject to stock availability. We may update, withdraw, or correct product information where necessary. If an item becomes unavailable after an order is submitted, we will contact you about the next step."] },
    { title: "Orders", paragraphs: ["Submitting an order asks Glad Style Fashion to reserve and process the selected pieces. We may contact you to confirm delivery details or product selections before processing. An order is subject to acceptance and stock availability."] },
    { title: "Pricing and delivery", paragraphs: ["Prices are shown in Nigerian naira. Delivery is paid by the customer and is handled under our Shipping & Delivery policy. Current delivery coverage is Nigeria only."] },
    { title: "Acceptable use", paragraphs: ["You must not misuse the website, interfere with its operation, attempt unauthorised access, or submit false order information."] },
    { title: "Changes to these terms", paragraphs: ["We may update these terms as the business and services develop. The version published on this page applies to current use of the website."] },
  ]} />;
}
