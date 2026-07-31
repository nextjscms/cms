import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@neondatabase/serverless', 'drizzle-orm', 'pg'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./drizzle/**/*'],
    },
  },
};

export default nextConfig;
