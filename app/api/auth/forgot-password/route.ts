import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";

const GENERIC_OK =
  "If an account exists with that username or email, we sent a password reset link.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier ?? body?.username ?? body?.email ?? "").trim();

    if (!identifier) {
      return NextResponse.json({ error: "Username or email is required" }, { status: 400 });
    }

    const result = await requestPasswordReset(identifier);

    if (result.reason === "email_not_configured") {
      return NextResponse.json(
        { error: "Password reset email is not configured on the server. Contact support." },
        { status: 503 },
      );
    }

    if (result.reason === "no_email") {
      return NextResponse.json(
        {
          error:
            "No email is linked to this account. Ask another admin to add your email, or run: npm run set-admin-email -- <username> <email>",
        },
        { status: 400 },
      );
    }

    // Always return success for unknown accounts (avoid account enumeration).
    return NextResponse.json({ success: true, message: GENERIC_OK });
  } catch (e) {
    console.error("[auth/forgot-password]", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
