import { NextResponse } from "next/server";
import { COOKIE_NAME, signAdminJwt } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username as string | undefined;
    const password = body?.password as string | undefined;

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
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
