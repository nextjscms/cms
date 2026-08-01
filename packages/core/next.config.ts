import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  console.error('\n❌ ERROR: AUTH_SECRET is missing!');
  console.error('NextAuth requires a secret to encrypt sessions in production.');
  console.error('Please add a random string as the AUTH_SECRET Environment Variable.\n');
  process.exit(1);
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['@neondatabase/serverless', 'drizzle-orm', 'pg'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingIncludes: {
    '/**': ['./drizzle/**/*'],
  },
};

export default nextConfig;
