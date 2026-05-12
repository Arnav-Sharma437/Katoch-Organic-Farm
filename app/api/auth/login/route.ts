import { NextResponse } from "next/server";
import { COOKIE_NAME, signAdminJwt } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();

    const adminUser = (process.env.ADMIN_USERNAME ?? "").trim();
    const adminPass = (process.env.ADMIN_PASSWORD ?? "").trim();

    if (!adminUser || !adminPass) {
      return NextResponse.json(
        { error: "Admin login is not configured (set ADMIN_USERNAME and ADMIN_PASSWORD on the server)." },
        { status: 500 }
      );
    }

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAdminJwt();
    const res = NextResponse.json({ success: true });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
