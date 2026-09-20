// app/admin/layout.tsx or page.tsx
import { cookies } from "next/headers";
import { AdminShell } from "../../components/admin/admin-layout-wrapper";
import { requireAdmin } from "../../lib/admin-auth";

export default async function Page({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAdmin();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return <AdminShell defaultOpen={defaultOpen} user={{ name: currentUser.name, email: currentUser.email, role: currentUser.role }}>{children}</AdminShell>;
}
