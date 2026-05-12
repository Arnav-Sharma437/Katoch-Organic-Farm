import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";
import { assertAdminFromCookies } from "@/lib/auth";

function serializeAdmin(doc: {
  _id: unknown;
  name: string;
  quote: string;
  isVisible: boolean;
  order: number;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    quote: doc.quote,
    isVisible: doc.isVisible,
    order: doc.order,
  };
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    await connectDB();
    const doc = await Testimonial.findById(params.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.quote !== undefined) doc.quote = String(body.quote).trim();
    if (body.isVisible !== undefined) doc.isVisible = Boolean(body.isVisible);
    if (body.order !== undefined) doc.order = Number(body.order) || 0;

    await doc.save();
    return NextResponse.json(serializeAdmin(doc.toObject()));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const doc = await Testimonial.findByIdAndDelete(params.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
