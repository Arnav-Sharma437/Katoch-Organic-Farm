import dns from "node:dns";
import { config } from "dotenv";
import mongoose from "mongoose";
import { resolveMongoUri } from "../lib/mongo-uri";
import { hashPassword, normalizeUsername } from "../lib/password";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
config({ path: ".env.local" });

async function main() {
  let uri: string;
  try {
    uri = resolveMongoUri();
  } catch {
    console.error("Missing MONGODB_URI in .env.local");
    process.exit(1);
  }

  const [, , usernameArg, passwordArg] = process.argv;
  if (!usernameArg?.trim() || !passwordArg) {
    console.error("Usage: npm run reset-admin-password -- <username> <new-password>");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const username = normalizeUsername(usernameArg);
  const hash = await hashPassword(passwordArg);

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const r = await db.collection("admins").findOneAndUpdate({ username }, { $set: { passwordHash: hash } });

  if (!r) {
    console.error(`Admin "${username}" not found`);
    process.exit(1);
  }

  console.log(`Password updated for ${username}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
