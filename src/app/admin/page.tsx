import { ChartAreaInteractive } from "@/components/admin/chart-area";
import { SectionCards } from "@/components/admin/section-cards";
import React from "react";
import { getCurrentUser } from "../../lib/admin-auth";
import { getAdminAnalytics } from "../../lib/admin/queries/analytics";
import { LiveOrdersTable } from "../../components/admin/live-orders-table";

export default async function Dashboard() {
  await getCurrentUser();
  const analytics = await getAdminAnalytics();
  const cards = [
    {
      description: "Paid sales",
      title: `₦${analytics.cards.totalSales.toLocaleString("en-NG")}`,
      action: "Live",
      footerMain: "Revenue from paid orders",
      footerSub: "Calculated from the orders table",
      trend: "up" as const,
    },
    {
      description: "Total orders",
      title: `${analytics.cards.totalOrders}`,
      action: "Live",
      footerMain: "Orders across all statuses",
      footerSub: "Includes guest and registered orders",
      trend: "up" as const,
    },
    {
      description: "Customer accounts",
      title: `${analytics.cards.customers}`,
      action: "Live",
      footerMain: "Registered customer accounts",
      footerSub: "Updated from the user table",
      trend: "up" as const,
    },
    {
      description: "Low stock",
      title: `${analytics.cards.lowStock}`,
      action: "Watch",
      footerMain: "Products with five or fewer left",
      footerSub: "Review inventory before promotion",
      trend: "down" as const,
    },
  ];

  return (
    <>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards cardData={cards} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={analytics.chart} />
          </div>
          <div className="px-4 lg:px-6">
            <LiveOrdersTable orders={analytics.orders} />
          </div>
        </div>
      </div>
    </>
  );
}
