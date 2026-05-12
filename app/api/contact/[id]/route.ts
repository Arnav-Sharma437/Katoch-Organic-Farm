import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { assertAdminFromCookies } from "@/lib/auth";

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    await connectDB();
    const doc = await Contact.findById(params.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.isRead !== undefined) doc.isRead = Boolean(body.isRead);
    await doc.save();
    return NextResponse.json(serialize(doc.toObject()));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const doc = await Contact.findByIdAndDelete(params.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
