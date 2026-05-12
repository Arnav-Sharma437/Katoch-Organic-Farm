import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const siteUrl = getSiteUrl();
const titleDefault = "Katoch Organic Farm | Cultivating Purity";
const description =
  "Organic fruits and vegetables from Kangra, Himachal Pradesh. Katoch Organic Farm — chemical-free produce, regenerative farming, and community roots since 2017.";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: titleDefault,
    template: "%s | Katoch Organic Farm",
  },
  description,
  applicationName: "Katoch Organic Farm",
  keywords: [
    "organic farm",
    "Kangra",
    "Himachal Pradesh",
    "organic vegetables",
    "organic fruit",
    "Katoch Organic Farm",
    "chemical free",
    "regenerative farming",
  ],
  authors: [{ name: "Katoch Organic Farm" }],
  creator: "Katoch Organic Farm",
  publisher: "Katoch Organic Farm",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Katoch Organic Farm",
    title: titleDefault,
    description,
    images: [
      {
        url: "https://arnav-sharma437.github.io/Katoch-Organic-Farm/images/logo.jpg",
        width: 800,
        height: 800,
        alt: "Katoch Organic Farm logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titleDefault,
    description,
    images: ["https://arnav-sharma437.github.io/Katoch-Organic-Farm/images/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [
      {
        url: "https://arnav-sharma437.github.io/Katoch-Organic-Farm/images/logo.jpg",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  },
  category: "agriculture",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#09150d" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#business`,
  name: "Katoch Organic Farm",
  description,
  url: siteUrl,
  image: "https://arnav-sharma437.github.io/Katoch-Organic-Farm/images/logo.jpg",
  telephone: "+91-78072-32423",
  email: "katochorganic0024@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Bain Indorian Teh Indora Po Kathgarh, Dist Kangra",
    addressLocality: "Kangra",
    addressRegion: "Himachal Pradesh",
    postalCode: "176401",
    addressCountry: "IN",
  },
  areaServed: { "@type": "AdministrativeArea", name: "Himachal Pradesh" },
  foundingDate: "2017",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={outfit.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
