import { migrate } from "drizzle-orm/sqlite-core/migrator";
import { db } from "./index.ts";

console.log("🔄 Running migrations...");

try {
  await migrate(db, {
    migrationsFolder: "./src/db/migrations"
  });
  console.log("✅ Migrations completed successfully");
} catch (error) {
  console.error("❌ Migration failed:", error);
  Deno.exit(1);
}

Deno.exit(0);