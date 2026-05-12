import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import { assertAdminFromCookies } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

function serialize(doc: {
  _id: unknown;
  title: string;
  year: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  order: number;
}) {
  return {
    id: String(doc._id),
    title: doc.title,
    year: doc.year,
    imageUrl: doc.imageUrl,
    cloudinaryPublicId: doc.cloudinaryPublicId,
    order: doc.order,
  };
}

export async function GET() {
  try {
    await connectDB();
    const items = await Gallery.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(items.map((d) => serialize(d as never)));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const year = String(formData.get("year") ?? "").trim();
    const image = formData.get("image");

    if (!title || !year) {
      return NextResponse.json({ error: "Title and year are required" }, { status: 400 });
    }

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const uploaded = await uploadImageBuffer(buffer, "katoch-farm/gallery");

    await connectDB();
    const maxOrder = await Gallery.findOne().sort({ order: -1 }).select("order").lean();
    const nextOrder = typeof maxOrder?.order === "number" ? maxOrder.order + 1 : 0;

    const created = await Gallery.create({
      title,
      year,
      imageUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      order: nextOrder,
    });

    return NextResponse.json(serialize(created.toObject()));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 });
  }
}
