import { NextResponse } from "next/server";
import { COOKIE_NAME, signAdminJwt } from "@/lib/auth";
import { bootstrapAdminFromEnv, verifyAdminCredentials } from "@/lib/admin-users";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

function isDbError(e: unknown): boolean {
  const err = e as { name?: string; code?: string; message?: string };
  return (
    err?.name === "MongoServerError" ||
    err?.name === "MongooseServerSelectionError" ||
    err?.code === "ENOTFOUND" ||
    /MONGODB_URI|ECONNREFUSED|authentication failed|bad auth/i.test(err?.message ?? "")
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.username ?? body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json({ error: "Username/email and password are required" }, { status: 400 });
    }

    if (!process.env.JWT_SECRET?.trim()) {
      return NextResponse.json(
        { error: "Server misconfigured: JWT_SECRET is not set on Vercel." },
        { status: 500 },
      );
    }

    let admin = await verifyAdminCredentials(identifier, password);

    if (!admin) {
      admin = await bootstrapAdminFromEnv(identifier, password);
    }

    if (!admin) {
      await connectDB();
      const hasAdmins = (await Admin.countDocuments()) > 0;
      if (!hasAdmins) {
        return NextResponse.json(
          {
            error:
              "No admin accounts exist yet. Run: npm run create-admin -- <username> <password> [email]",
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "Invalid username/email or password. Use your username, not only your email, if unsure." },
        { status: 401 },
      );
    }

    const token = await signAdminJwt({
      id: String(admin._id),
      username: admin.username,
    });
    const res = NextResponse.json({ success: true, username: admin.username });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    if (isDbError(e)) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. In Vercel, set MONGODB_URI with a URL-encoded password (@ → %40) and redeploy.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
