import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/password-reset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    const result = await resetPasswordWithToken(token, password);

    if (!result.ok) {
      if (result.error === "weak_password") {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, message: "Password updated. You can sign in now." });
  } catch (e) {
    console.error("[auth/reset-password]", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
