import { NextResponse } from "next/server";
import { COOKIE_NAME, signAdminJwt } from "@/lib/auth";
import { bootstrapAdminFromEnv, verifyAdminCredentials } from "@/lib/admin-users";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    let admin = await verifyAdminCredentials(username, password);

    if (!admin) {
      admin = await bootstrapAdminFromEnv(username, password);
    }

    if (!admin) {
      await connectDB();
      const hasAdmins = (await Admin.countDocuments()) > 0;
      if (!hasAdmins) {
        return NextResponse.json(
          {
            error:
              "No admin accounts exist yet. Run: npm run create-admin -- <username> <password>",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
