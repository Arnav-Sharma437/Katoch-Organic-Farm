import dns from "node:dns";
import { config } from "dotenv";
import mongoose from "mongoose";
import { setAdminEmail } from "../lib/admin-users";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local");
    process.exit(1);
  }

  const [, , usernameArg, emailArg] = process.argv;
  if (!usernameArg?.trim() || !emailArg?.trim()) {
    console.error("Usage: npm run set-admin-email -- <username> <email>");
    process.exit(1);
  }

  await mongoose.connect(uri);
  try {
    const admin = await setAdminEmail(usernameArg, emailArg);
    console.log(`Email set for ${admin.username}: ${admin.email}`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
