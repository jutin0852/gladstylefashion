import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../components/store/cart-context";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Glad Style Fashion | Ready-to-wear in Nigeria",
    template: "%s | Glad Style Fashion",
  },
  description: "Shop expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion in Nigeria.",
  applicationName: "Glad Style Fashion",
  keywords: ["Glad Style Fashion", "Nigerian fashion", "ready-to-wear Nigeria", "Lagos fashion", "boubou", "custom dresses"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Glad Style Fashion",
    title: "Glad Style Fashion | Ready-to-wear in Nigeria",
    description: "Expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glad Style Fashion | Ready-to-wear in Nigeria",
    description: "Expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
