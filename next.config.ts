import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/products/:image*.png", destination: "/products/:image*.webp" },
        { source: "/products/:image*.jpg", destination: "/products/:image*.webp" },
      ],
    };
  },
};

export default nextConfig;
