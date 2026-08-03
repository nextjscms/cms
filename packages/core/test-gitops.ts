import { getDb } from "./src/db";
import { settings } from "./src/db/schema";
import { eq } from "drizzle-orm";
async function run() {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, "gitops_settings"));
  console.log(rows);
}
run();
