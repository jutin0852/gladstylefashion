"use client";
import { usePathname } from "next/navigation";

export default function AdminHeaderTitle() {
  const pathname = usePathname();

  // Map paths → readable titles
  const titles: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/orders": "Order Management",
    "/admin/customers": "Customers",
  };

  const title = titles[pathname] || "Dashboard";

  return <h1 className="text-base font-medium">{title}</h1>;
}
