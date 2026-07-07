import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Shopify-hosted product/cart imagery via next/image.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
};

export default nextConfig;
