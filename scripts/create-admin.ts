import dns from "node:dns";
import { config } from "dotenv";
import mongoose from "mongoose";
import { createAdminUser } from "../lib/admin-users";

// Some networks block ISP DNS SRV lookups for MongoDB Atlas.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local");
    process.exit(1);
  }

  const [, , usernameArg, passwordArg, emailArg] = process.argv;
  const username = usernameArg ?? process.env.ADMIN_USERNAME ?? "";
  const password = passwordArg ?? process.env.ADMIN_PASSWORD ?? "";
  const email = emailArg ?? process.env.ADMIN_EMAIL ?? "";

  if (!username.trim() || !password) {
    console.error("Usage: npm run create-admin -- <username> <password> [email]");
    console.error("Or set ADMIN_USERNAME, ADMIN_PASSWORD, and optional ADMIN_EMAIL in .env.local.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  try {
    const admin = await createAdminUser(username, password, email || undefined);
    console.log(`Admin created: ${admin.username} (id: ${admin._id})`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
