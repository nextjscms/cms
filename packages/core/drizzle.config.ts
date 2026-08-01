import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERROR: DATABASE_URL is missing! Please add it to your Environment Variables.\n');
  process.exit(1);
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
