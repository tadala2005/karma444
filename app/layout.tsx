
import type {
  Metadata,
  Viewport
} from "next";

import "./globals.css";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Pwa } from "@/components/pwa";

export const metadata: Metadata = {
  title: {
    default: "Karma Curated — What You Deserve",
    template: "%s | Karma Curated"
  },

  description:
    "Karma Curated is an independent platform for music, culture, streetwear and experiences from Malawi.",

  applicationName: "Karma Curated",

  manifest: "/manifest.webmanifest",

  openGraph: {
    title: "Karma Curated — What You Deserve",
    description: "Music. Style. People. Malawi.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#101010",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Pwa />
        <Header />

        {!process.env.DATABASE_URL && (
          <div className="demo-banner">
            PREVIEW MODE · LIVE ORDERS REQUIRE
            DATABASE AND PAYCHANGU
          </div>
        )}

        {children}

        <Footer />
      </body>
    </html>
  );
}
