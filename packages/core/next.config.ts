import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@neondatabase/serverless', 'drizzle-orm', 'pg'],
};

export default nextConfig;
