import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

import Gallery from "../models/Gallery";
import Testimonial from "../models/Testimonial";

const gallerySeed = [
  {
    title: "Farm Fields",
    year: "2020",
    imageUrl: "https://picsum.photos/seed/kofg1/800/600",
    cloudinaryPublicId: "seed/farm-fields",
    order: 0,
  },
  {
    title: "Organic Produce",
    year: "2020",
    imageUrl: "https://picsum.photos/seed/kofg2/800/600",
    cloudinaryPublicId: "seed/organic-produce",
    order: 1,
  },
  {
    title: "Crop Season",
    year: "2020",
    imageUrl: "https://picsum.photos/seed/kofg3/800/600",
    cloudinaryPublicId: "seed/crop-season",
    order: 2,
  },
  {
    title: "Summer Harvest",
    year: "2020",
    imageUrl: "https://picsum.photos/seed/kofg4/800/600",
    cloudinaryPublicId: "seed/summer-harvest",
    order: 3,
  },
  {
    title: "Kangra Landscape",
    year: "2023",
    imageUrl: "https://picsum.photos/seed/kofg5/800/600",
    cloudinaryPublicId: "seed/kangra-landscape",
    order: 4,
  },
  {
    title: "Farm Life",
    year: "2023",
    imageUrl: "https://picsum.photos/seed/kofg6/800/600",
    cloudinaryPublicId: "seed/farm-life",
    order: 5,
  },
];

const testimonialSeed = [
  {
    name: "Anurag Kaushal",
    quote:
      "The freshest organic produce I have ever tasted. You can truly feel the purity in every bite.",
    isVisible: true,
    order: 0,
  },
  {
    name: "Karishma Kahar",
    quote: "Katoch Organic Farm is doing incredible work for the environment and the local community.",
    isVisible: true,
    order: 1,
  },
  {
    name: "Armaan Kaushal",
    quote: "Visiting the farm was an eye-opener. Their regenerative methods are the future of farming.",
    isVisible: true,
    order: 2,
  },
  {
    name: "Rickey Nanda",
    quote:
      "Top quality fruits and veggies! Knowing exactly where my food comes from gives me peace of mind.",
    isVisible: true,
    order: 3,
  },
  {
    name: "Nikhil Kumar",
    quote: "A model for sustainability. The dedication of the team is reflected in the amazing harvest.",
    isVisible: true,
    order: 4,
  },
  {
    name: "Noor Gupta",
    quote:
      "Absolutely love their produce! The difference in taste compared to regular market veggies is huge.",
    isVisible: true,
    order: 5,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local");
    throw new Error("Missing MONGODB_URI");
  }

  await mongoose.connect(uri);

  const gCount = await Gallery.countDocuments();
  const tCount = await Testimonial.countDocuments();

  if (gCount > 0 || tCount > 0) {
    console.log("Database already has gallery or testimonials. Skipping seed.");
    await mongoose.disconnect();
    return;
  }

  await Gallery.insertMany(gallerySeed);
  await Testimonial.insertMany(testimonialSeed);

  console.log("Seed complete: gallery + testimonials inserted.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
