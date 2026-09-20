import PolicyPage from "../../components/store/policy-page";

export default function ShippingDeliveryPage() {
  return <PolicyPage eyebrow="Glad Style Fashion policies" title="Shipping & delivery" intro="These are the delivery terms for our ready-to-wear collection. We currently deliver within Nigeria only." sections={[
    { title: "Where we deliver", paragraphs: ["Glad Style Fashion currently accepts delivery addresses in Nigeria. International delivery will be introduced separately when it is ready."] },
    { title: "Delivery timing", paragraphs: ["Orders are prepared after they are confirmed. Please allow approximately 5–7 working days for delivery. Working days exclude weekends and public holidays.", "If there is a delay that affects your order, we will contact you using the details provided at checkout."] },
    { title: "Delivery fees", paragraphs: ["Delivery is paid by the customer. The applicable delivery fee will be confirmed with you using your delivery address before dispatch."] },
    { title: "Delivery address", paragraphs: ["Please provide a complete and accurate delivery address, including your phone number. We cannot accept responsibility for delays or failed deliveries caused by incorrect or incomplete details."] },
    { title: "Receiving your order", paragraphs: ["Please inspect your parcel when it arrives. If your package appears damaged or an item is missing, contact Glad Style Fashion as soon as possible with your order number and clear photographs where applicable."] },
  ]} />;
}
