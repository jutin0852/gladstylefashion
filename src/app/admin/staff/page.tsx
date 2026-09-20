import { getStaffData } from "@/app/actions/staff";
import { StaffManagement } from "@/components/admin/staff-management";
export default async function StaffPage() { const { members, invitations } = await getStaffData(); return <StaffManagement members={members} invitations={invitations} />; }
