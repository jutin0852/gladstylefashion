import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../components/store/cart-context";

export const metadata: Metadata = {
  title: "Glad Style Fashion | Modern wardrobe essentials",
  description: "Thoughtful pieces for the way you move through the world.",
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
