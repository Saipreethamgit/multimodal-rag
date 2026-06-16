import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pdf-parse", "sharp"],
};

export default nextConfig;
