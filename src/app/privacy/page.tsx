import PolicyPage from "../../components/store/policy-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy", description: "How Glad Style Fashion collects and uses customer information." };

export default function PrivacyPage() {
  return <PolicyPage eyebrow="Glad Style Fashion policies" title="Privacy" intro="This policy explains the information Glad Style Fashion collects when you visit our store or place an order, and how we use it." sections={[
    { title: "Information we collect", paragraphs: ["When you place an order, we collect the information needed to fulfil it: your name, email address, phone number where supplied, delivery address, selected products, sizes, and order notes."] },
    { title: "How we use it", paragraphs: ["We use your information to process and fulfil orders, communicate about your order, provide support, maintain store records, and improve the store. We do not sell your personal information."] },
    { title: "Who receives it", paragraphs: ["We share only the information required to deliver an order with service providers involved in operating the store, such as delivery partners and payment providers when payment is enabled."] },
    { title: "Keeping information", paragraphs: ["We keep order records for as long as reasonably necessary for customer service, accounting, legal obligations, and resolving issues. We protect access to customer records through staff permissions."] },
    { title: "Your choices", paragraphs: ["You may contact Glad Style Fashion to ask about the personal information connected to your order, correct inaccurate information, or raise a privacy concern. We may need to verify your identity before acting on a request."] },
  ]} />;
}
