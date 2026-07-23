import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by OpenNext (Cloudflare adapter) — it bundles the standalone server.
  output: "standalone",
  images: { unoptimized: true },
};

export default nextConfig;
