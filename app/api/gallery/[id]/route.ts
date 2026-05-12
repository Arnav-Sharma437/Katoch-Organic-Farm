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

async function safeDestroy(publicId: string) {
  if (!publicId || publicId.startsWith("seed/")) return;
  if (!isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error("Cloudinary destroy failed", e);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const existing = await Gallery.findById(params.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const formData = await request.formData();
    const titleRaw = formData.get("title");
    const yearRaw = formData.get("year");
    const image = formData.get("image");

    if (titleRaw !== null) existing.title = String(titleRaw).trim();
    if (yearRaw !== null) existing.year = String(yearRaw).trim();

    if (image instanceof File && image.size > 0) {
      if (!isCloudinaryConfigured()) {
        return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
      }
      await safeDestroy(existing.cloudinaryPublicId);
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploaded = await uploadImageBuffer(buffer, "katoch-farm/gallery");
      existing.imageUrl = uploaded.secure_url;
      existing.cloudinaryPublicId = uploaded.public_id;
    }

    await existing.save();
    return NextResponse.json(serialize(existing.toObject()));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update gallery item" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const authed = await assertAdminFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const existing = await Gallery.findById(params.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await safeDestroy(existing.cloudinaryPublicId);
    await existing.deleteOne();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete gallery item" }, { status: 500 });
  }
}
