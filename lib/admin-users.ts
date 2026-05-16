import Admin from "@/models/Admin";
import { connectDB } from "@/lib/mongodb";
import { hashPassword, normalizeUsername, verifyPassword } from "@/lib/password";

export async function findAdminWithPassword(username: string) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  await connectDB();
  return Admin.findOne({ username: normalized }).select("+passwordHash");
}

export async function verifyAdminCredentials(username: string, password: string) {
  const admin = await findAdminWithPassword(username);
  if (!admin?.passwordHash) return null;
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return null;
  return admin;
}

/** One-time bootstrap: create first admin from env when the collection is empty. */
export async function bootstrapAdminFromEnv(username: string, password: string) {
  await connectDB();
  const count = await Admin.countDocuments();
  if (count > 0) return null;

  const envUser = normalizeUsername(process.env.ADMIN_USERNAME ?? "");
  const envPass = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!envUser || !envPass) return null;
  if (normalizeUsername(username) !== envUser || password !== envPass) return null;

  return Admin.create({
    username: envUser,
    passwordHash: await hashPassword(envPass),
  });
}

export async function createAdminUser(username: string, password: string) {
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error("Username is required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  await connectDB();
  const existing = await Admin.findOne({ username: normalized });
  if (existing) throw new Error(`Admin "${normalized}" already exists`);

  return Admin.create({
    username: normalized,
    passwordHash: await hashPassword(password),
  });
}
