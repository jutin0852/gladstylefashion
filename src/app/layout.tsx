import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "../components/store/cart-context";
import { getSiteUrl } from "@/lib/site-url";
import { GoogleAnalytics } from "../components/analytics/google-analytics";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/" },
  title: {
    default: "Glad Style Fashion | Ready-to-wear fashion",
    template: "%s | Glad Style Fashion",
  },
  description: "Shop expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion.",
  applicationName: "Glad Style Fashion",
  icons: {
    icon: [
      { url: "/brand/favicon-32-circle.png?v=7", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon-192-circle.png?v=7", type: "image/png", sizes: "192x192" },
    ],
    shortcut: [{ url: "/brand/favicon-32-circle.png?v=7", type: "image/png" }],
    apple: [{ url: "/brand/favicon-192-circle.png?v=7", type: "image/png", sizes: "192x192" }],
  },
  keywords: ["Glad Style Fashion", "ready-to-wear fashion", "boubou", "custom dresses", "occasion wear"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Glad Style Fashion",
    title: "Glad Style Fashion | Ready-to-wear fashion",
    description: "Expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion.",
    images: [{ url: "/brand/glad-style-fashion-logo-transparent.png", width: 1940, height: 701, alt: "Glad Style Fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glad Style Fashion | Ready-to-wear fashion",
    description: "Expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion.",
    images: ["/brand/glad-style-fashion-logo-transparent.png"],
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
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ClothingStore",
          name: "Glad Style Fashion",
          url: getSiteUrl(),
          logo: `${getSiteUrl()}/brand/glad-style-fashion-logo-transparent.png`,
          description: "Expressive ready-to-wear dresses, boubous, and custom occasion pieces from Glad Style Fashion.",
          areaServed: "NG",
          sameAs: ["https://www.instagram.com/gladstylefashion/"],
        }) }} />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
