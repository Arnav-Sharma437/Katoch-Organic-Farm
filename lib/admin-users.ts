import Admin from "@/models/Admin";
import { connectDB } from "@/lib/mongodb";
import { hashPassword, normalizeUsername, verifyPassword } from "@/lib/password";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function findAdminByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  await connectDB();
  if (trimmed.includes("@")) {
    return Admin.findOne({ email: normalizeEmail(trimmed) }).select("+passwordHash");
  }
  return Admin.findOne({ username: normalizeUsername(trimmed) }).select("+passwordHash");
}

/** @deprecated use findAdminByIdentifier */
export async function findAdminWithPassword(username: string) {
  return findAdminByIdentifier(username);
}

function envCredentials() {
  const envUser = normalizeUsername(process.env.ADMIN_USERNAME ?? "");
  const envPass = (process.env.ADMIN_PASSWORD ?? "").trim();
  const envEmail = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  if (!envUser || !envPass) return null;
  return { envUser, envPass, envEmail };
}

function matchesEnv(identifier: string, password: string) {
  const env = envCredentials();
  if (!env) return false;
  const id = identifier.trim();
  const userMatch =
    normalizeUsername(id) === env.envUser ||
    (id.includes("@") && normalizeEmail(id) === env.envEmail && env.envEmail);
  return userMatch && password === env.envPass;
}

/** Sync or create admin from env when server env matches (recovery path). */
async function upsertAdminFromEnv() {
  const env = envCredentials();
  if (!env) return null;
  await connectDB();
  return Admin.findOneAndUpdate(
    { username: env.envUser },
    {
      username: env.envUser,
      passwordHash: await hashPassword(env.envPass),
      ...(env.envEmail ? { email: env.envEmail } : {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).select("+passwordHash");
}

export async function verifyAdminCredentials(identifier: string, password: string) {
  let admin = await findAdminByIdentifier(identifier);

  if (admin?.passwordHash) {
    const ok = await verifyPassword(password, admin.passwordHash);
    if (ok) return admin;
  }

  if (matchesEnv(identifier, password)) {
    return upsertAdminFromEnv();
  }

  return null;
}

/** One-time bootstrap: create first admin from env when the collection is empty. */
export async function bootstrapAdminFromEnv(username: string, password: string) {
  await connectDB();
  const count = await Admin.countDocuments();
  if (count > 0) return null;
  if (!matchesEnv(username, password)) return null;
  return upsertAdminFromEnv();
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
