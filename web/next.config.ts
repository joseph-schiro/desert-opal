import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Shopify-hosted product/cart imagery via next/image.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
  // heic-convert loads a WASM decoder (libheif); keep it out of the bundle so
  // it's required from node_modules at runtime on the server.
  serverExternalPackages: ["heic-convert"],
  experimental: {
    // Product photos (esp. multi-image uploads from a phone) blow past the
    // 1MB default Server Action body limit, which fails the whole request.
    // These are authenticated admin-only uploads, so a generous cap is fine.
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
