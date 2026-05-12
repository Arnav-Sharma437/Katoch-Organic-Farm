import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";
import { assertAdminFromCookies } from "@/lib/auth";

function serializePublic(doc: {
  _id: unknown;
  name: string;
  quote: string;
  order: number;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    quote: doc.quote,
    order: doc.order,
  };
}

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

export async function GET() {
  try {
    await connectDB();
    const admin = await assertAdminFromCookies();

    if (admin) {
      const items = await Testimonial.find().sort({ order: 1, createdAt: 1 }).lean();
      return NextResponse.json(items.map((d) => serializeAdmin(d as never)));
    }

    const items = await Testimonial.find({ isVisible: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return NextResponse.json(items.map((d) => serializePublic(d as never)));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load testimonials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const quote = String(body?.quote ?? "").trim();
    const isVisible = Boolean(body?.isVisible);
    let order =
      typeof body?.order === "number" && !Number.isNaN(body.order)
        ? body.order
        : Number(body?.order);

    if (!name || !quote) {
      return NextResponse.json({ error: "Name and quote are required" }, { status: 400 });
    }

    await connectDB();
    if (Number.isNaN(order)) {
      const maxOrder = await Testimonial.findOne().sort({ order: -1 }).select("order").lean();
      order = typeof maxOrder?.order === "number" ? maxOrder.order + 1 : 0;
    }

    const created = await Testimonial.create({ name, quote, isVisible, order });
    return NextResponse.json(serializeAdmin(created.toObject()));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
