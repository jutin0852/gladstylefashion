import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  await requireAdmin();

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { message: "Cloudinary is not configured" },
      { status: 503 },
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const transformation = "c_limit,w_1600,q_82";
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "uploads",
      transformation,
    },
    apiSecret,
  );

  return NextResponse.json({
    timestamp,
    signature,
    cloudName,
    apiKey,
    transformation,
  });
}
