import { SectionCards } from "@/components/admin/section-cards";
import { LiveOrdersTable } from "@/components/admin/live-orders-table";
import { getAdminAnalytics } from "../../../lib/admin/queries/analytics";
import { requireAdmin } from "../../../lib/admin-auth";

export default async function OrdersPage() {
  await requireAdmin();
  const analytics = await getAdminAnalytics();
  const cards = [
    {
      description: "Paid sales",
      title: `$${analytics.cards.totalSales.toFixed(2)}`,
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
  ];
  return (
    <div className="@container/main flex flex-1 flex-col px-4 py-4 md:py-6 lg:px-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-semibold text-base">Order List</h1>
      </div>

      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards cardData={cards} />
        <LiveOrdersTable orders={analytics.orders} />
      </div>
    </div>
  );
}
