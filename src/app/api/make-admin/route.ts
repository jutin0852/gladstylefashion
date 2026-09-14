import { checkAdminStatus, makeUserAdmin } from "@/lib/create-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  await requireAdmin();

  const { email, action } = await request.json();
  if (!email) {
    return NextResponse.json("Email is required", { status: 400 });
  }
  if (action === "makeAdmin") {
    const success = await makeUserAdmin(email);
    if (success) {
      return NextResponse.json(
        { message: "User made admin successfully" },
        { status: 200 },
      );
    } else {
      return NextResponse.json("Failed to make user admin", { status: 500 });
    }
  }
  if (action === "checkAdminStatus") {
    const isAdmin = await checkAdminStatus(email);
    return NextResponse.json({
      email,
      isAdmin,
      message: isAdmin ? "User is admin" : "User is not admin",
    });
  }

  return NextResponse.json({ message: "Unsupported action" }, { status: 400 });
};
