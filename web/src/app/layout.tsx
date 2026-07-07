import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Fraunces: a soft, boutique serif for headings (professional + a little charming)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Nunito: rounded, friendly sans for body/UI (the "cutesy" without being girly)
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s · Desert Opal",
  },
  description:
    "Hand-picked succulents, cacti, and desert treasures. Grown with love, shipped with care.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Hand-picked succulents, cacti, and desert treasures. Grown with love, shipped with care.",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
