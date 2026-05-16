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

  const envEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  return Admin.create({
    username: envUser,
    ...(envEmail ? { email: envEmail } : {}),
    passwordHash: await hashPassword(envPass),
  });
}

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function createAdminUser(username: string, password: string, email?: string) {
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error("Username is required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  const normalizedEmail = email ? normalizeEmail(email) : "";
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invalid email address");
  }

  await connectDB();
  const existing = await Admin.findOne({ username: normalized });
  if (existing) throw new Error(`Admin "${normalized}" already exists`);

  if (normalizedEmail) {
    const emailTaken = await Admin.findOne({ email: normalizedEmail });
    if (emailTaken) throw new Error(`Email "${normalizedEmail}" is already in use`);
  }

  return Admin.create({
    username: normalized,
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    passwordHash: await hashPassword(password),
  });
}

export async function setAdminEmail(username: string, email: string) {
  const normalized = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  if (!normalized) throw new Error("Username is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invalid email address");
  }

  await connectDB();
  const taken = await Admin.findOne({ email: normalizedEmail, username: { $ne: normalized } });
  if (taken) throw new Error(`Email "${normalizedEmail}" is already in use`);

  const admin = await Admin.findOneAndUpdate(
    { username: normalized },
    { email: normalizedEmail },
    { new: true },
  );
  if (!admin) throw new Error(`Admin "${normalized}" not found`);
  return admin;
}
