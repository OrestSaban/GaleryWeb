import type { Metadata } from "next";
import { cormorant, dmSans } from "./fonts";
import { SITE } from "@/lib/utils";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.artist} — ${SITE.strapline}`,
    template: `%s — ${SITE.artist}`,
  },
  description:
    "Online gallery of Iryna Izotova: soft watercolours, quiet geometry, and swallows in both. Ivano-Frankivsk → Prague.",
  openGraph: {
    title: `${SITE.artist} — ${SITE.strapline}`,
    description:
      "Soft watercolours, quiet geometry, and swallows in both. Browse works and contact the artist directly.",
    url: siteUrl,
    siteName: SITE.artist,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
