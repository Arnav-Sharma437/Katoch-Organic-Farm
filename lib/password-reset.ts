import { createHash, randomBytes } from "node:crypto";
import Admin from "@/models/Admin";
import { connectDB } from "@/lib/mongodb";
import { hashPassword, normalizeUsername } from "@/lib/password";
import { formatResendFrom } from "@/lib/format-resend-from";
import { isResendConfigured, resend } from "@/lib/resend";
import { getSiteUrl } from "@/lib/site-url";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashResetToken(token) };
}

export async function findAdminForReset(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  await connectDB();
  if (trimmed.includes("@")) {
    return Admin.findOne({ email: normalizeEmail(trimmed) }).select(
      "+passwordResetTokenHash +passwordResetExpires",
    );
  }
  return Admin.findOne({ username: normalizeUsername(trimmed) }).select(
    "+passwordResetTokenHash +passwordResetExpires",
  );
}

export async function requestPasswordReset(identifier: string): Promise<{
  sent: boolean;
  reason?: "no_account" | "no_email" | "email_not_configured";
}> {
  const admin = await findAdminForReset(identifier);
  if (!admin) return { sent: false, reason: "no_account" };

  const email = admin.email?.trim();
  if (!email) return { sent: false, reason: "no_email" };

  if (!isResendConfigured() || !resend) return { sent: false, reason: "email_not_configured" };

  const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "").trim();
  if (!fromEmail) return { sent: false, reason: "email_not_configured" };

  const { token, hash } = createResetToken();
  admin.passwordResetTokenHash = hash;
  admin.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await admin.save();

  const resetUrl = `${getSiteUrl()}/admin/reset-password?token=${encodeURIComponent(token)}`;

  const result = await resend.emails.send({
    from: formatResendFrom(fromEmail),
    to: email,
    subject: "Reset your admin password — Katoch Organic Farm",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d8e8da;">
          <tr>
            <td style="padding:28px 32px;color:#1a2b20;">
              <h2 style="margin:0 0 12px;color:#2d5a27;font-size:20px;">Password reset</h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${admin.username}, click the button below to choose a new password. This link expires in 1 hour.</p>
              <p style="margin:0 0 24px;">
                <a href="${resetUrl}" style="display:inline-block;background:#2d5a27;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">Reset password</a>
              </p>
              <p style="margin:0;font-size:13px;color:#4a5c50;line-height:1.6;">If you did not request this, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });

  if (result.error) {
    admin.passwordResetTokenHash = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();
    console.error("[password-reset] Resend error", result.error);
    return { sent: false, reason: "email_not_configured" };
  }

  return { sent: true };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!token.trim()) return { ok: false as const, error: "invalid_token" };
  if (newPassword.length < 8) return { ok: false as const, error: "weak_password" };

  await connectDB();
  const hash = hashResetToken(token.trim());
  const admin = await Admin.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires +passwordHash");

  if (!admin) return { ok: false as const, error: "invalid_token" };

  admin.passwordHash = await hashPassword(newPassword);
  admin.passwordResetTokenHash = undefined;
  admin.passwordResetExpires = undefined;
  await admin.save();

  return { ok: true as const };
}
