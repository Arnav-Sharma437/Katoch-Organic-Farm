import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { assertAdminFromCookies } from "@/lib/auth";
import { isResendConfigured, resend } from "@/lib/resend";

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function serialize(doc: {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    message: doc.message,
    isRead: doc.isRead,
    createdAt: doc.createdAt?.toISOString() ?? null,
  };
}

export async function GET() {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const items = await Contact.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(items.map((d) => serialize(d as never)));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectDB();
    const doc = await Contact.create({ firstName, lastName, email, message });

    const submittedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const toEmail = process.env.RESEND_TO_EMAIL;

    if (!isResendConfigured() || !resend || !fromEmail || !toEmail) {
      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
        id: String(doc._id),
        emailSkipped: true,
      });
    }

    const ownerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8e8da;">
          <tr>
            <td style="background:linear-gradient(135deg,#2d5a27,#4da657);padding:28px 32px;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;font-weight:600;">New contact — Katoch Organic Farm</h1>
              <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">${escHtml(submittedAt)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#1a2b20;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.6;">
                <tr><td style="padding:6px 0;color:#4a5c50;width:120px;">Name</td><td style="padding:6px 0;"><strong>${escHtml(firstName)} ${escHtml(lastName)}</strong></td></tr>
                <tr><td style="padding:6px 0;color:#4a5c50;">Email</td><td style="padding:6px 0;"><a href="mailto:${escHtml(email)}" style="color:#2d5a27;">${escHtml(email)}</a></td></tr>
              </table>
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5ede7;">
                <p style="margin:0 0 8px;color:#4a5c50;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
                <p style="margin:0;white-space:pre-wrap;font-size:15px;">${escHtml(message)}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const autoReplyHtml = `
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
              <h2 style="margin:0 0 12px;color:#2d5a27;font-size:20px;">Thank you for reaching out</h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${escHtml(firstName)}, we received your message and will get back to you soon.</p>
              <p style="margin:0;font-size:14px;color:#4a5c50;line-height:1.6;">— Katoch Organic Farm<br>Kangra, Himachal Pradesh</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const [toUser, toVisitor] = await Promise.all([
        resend.emails.send({
          from: fromEmail,
          to: toEmail,
          subject: `New website message from ${firstName} ${lastName}`,
          html: ownerHtml,
        }),
        resend.emails.send({
          from: fromEmail,
          to: email,
          subject: "We received your message — Katoch Organic Farm",
          html: autoReplyHtml,
        }),
    ]);

    if (toUser.error || toVisitor.error) {
      console.error(toUser.error ?? toVisitor.error);
      return NextResponse.json(
        { error: "Message saved but email could not be sent. Please try again later." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      id: String(doc._id),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
