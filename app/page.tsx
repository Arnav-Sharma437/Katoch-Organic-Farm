import HomeClient from "@/components/website/HomeClient";
import { internalServerFetch } from "@/lib/server-fetch";
import type { GalleryItem } from "@/components/website/Gallery";
import type { TestimonialItem } from "@/components/website/Testimonials";

export default async function HomePage() {
  let gallery: GalleryItem[] = [];
  let testimonials: TestimonialItem[] = [];

  try {
    const gRes = await internalServerFetch("/api/gallery");
    if (gRes.ok) gallery = await gRes.json();
  } catch {
    gallery = [];
  }

  try {
    const tRes = await internalServerFetch("/api/testimonials");
    if (tRes.ok) testimonials = await tRes.json();
  } catch {
    testimonials = [];
  }

  return <HomeClient gallery={gallery} testimonials={testimonials} />;
}
