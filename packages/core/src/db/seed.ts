import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, settings } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.log("No DATABASE_URL or POSTGRES_URL found. Skipping seed.");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const siteName = process.env.WEBSITE_NAME || "NextjsCMS";

  if (!adminEmail || !adminPassword) {
    console.log("No ADMIN_EMAIL or ADMIN_PASSWORD found in environment. Skipping auto-provisioning.");
    return;
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  try {
    // 1. Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, adminEmail));
    if (existingUsers.length === 0) {
      console.log(`Creating Admin user: ${adminEmail}`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(adminPassword));
      const passwordHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      await db.insert(users).values({
        name: "Admin",
        email: adminEmail,
        password: passwordHash,
        role: "admin",
      });
      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user already exists. Skipping user creation.");
    }

    // 2. Set Site Name
    const existingSiteName = await db.select().from(settings).where(eq(settings.key, "siteName"));
    if (existingSiteName.length === 0) {
      console.log(`Setting Site Name: ${siteName}`);
      await db.insert(settings).values({
        key: "siteName",
        value: siteName,
      });
    } else {
      await db.update(settings).set({ value: siteName }).where(eq(settings.key, "siteName"));
      console.log("Site Name updated.");
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
