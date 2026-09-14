import { CustomerList } from "../../../components/admin/customer-list";
import { requireAdmin } from "../../../lib/admin-auth";
import { getAdminCustomers } from "../../../lib/admin/queries/customers";

export default async function Customers() {
  await requireAdmin();
  const customers = await getAdminCustomers();
  const totalValue = customers.reduce((total, customer) => total + Number(customer.totalSpent), 0);
  return (
    <section className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6"><div><h1 className="text-xl font-semibold">Customers</h1><p className="text-sm text-muted-foreground">Live customer records from guest and registered orders.</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Customers</p><p className="mt-2 text-2xl font-semibold">{customers.length}</p></div><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Registered customers</p><p className="mt-2 text-2xl font-semibold">{customers.filter((customer) => customer.registered).length}</p></div><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Order value</p><p className="mt-2 text-2xl font-semibold">${totalValue.toFixed(2)}</p></div></div><CustomerList customers={customers} /></section>
  );
}
