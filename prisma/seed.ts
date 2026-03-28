import { hash } from "bcryptjs";
import { execSync } from "child_process";
import * as path from "path";
import * as crypto from "crypto";

async function main() {
  const password = await hash("admin123", 12);
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 25);
  const now = new Date().toISOString();
  const dbPath = path.join(__dirname, "..", "dev.db");

  const sql = `INSERT OR IGNORE INTO User (id, name, email, password, role, createdAt, updatedAt) VALUES ('${id}', 'Admin', 'admin@screenr.app', '${password}', 'ADMIN', '${now}', '${now}');`;

  execSync(`sqlite3 "${dbPath}" "${sql}"`, { stdio: "inherit" });
  console.log("Seed complete: Admin user created (admin@screenr.app / admin123)");
}

main().catch(console.error);
