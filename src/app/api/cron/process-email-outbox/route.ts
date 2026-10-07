import { NextResponse } from "next/server";
import { processEmailOutbox } from "@/lib/email-outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json(await processEmailOutbox());
}
