import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, settings, menus, menuItems, posts } from "./schema";
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
    // 3. Seed Default Primary Menu
    const existingMenu = await db.select().from(menus).where(eq(menus.slug, "primary"));
    let menuId: number;
    if (existingMenu.length === 0) {
      console.log("Creating Primary Menu...");
      const insertedMenu = await db.insert(menus).values({
        name: "Primary Menu",
        slug: "primary",
      }).returning({ id: menus.id });
      menuId = insertedMenu[0].id;

      await db.insert(menuItems).values([
        { menuId, label: "Home", url: "/", order: 1 },
        { menuId, label: "Blog", url: "/blog", order: 2 },
        { menuId, label: "About", url: "/about", order: 3 },
      ]);
      console.log("Primary Menu and Items created.");
    } else {
      console.log("Primary Menu already exists. Skipping.");
      menuId = existingMenu[0].id;
    }

    // 4. Seed Default 'Hello World' Post
    const existingPost = await db.select().from(posts).where(eq(posts.slug, "hello-world"));
    if (existingPost.length === 0) {
      console.log("Creating 'Hello World' post...");
      
      // Need an author ID for the post
      const admin = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail));
      const authorId = admin.length > 0 ? admin[0].id : 1;

      await db.insert(posts).values({
        title: "Hello World!",
        slug: "hello-world",
        content: "Welcome to NextjsCMS. This is your very first post. You can edit this or delete it in the admin panel.",
        status: "published",
        authorId: authorId,
      });
      console.log("'Hello World' post created.");
    } else {
      console.log("'Hello World' post already exists. Skipping.");
    }

  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
